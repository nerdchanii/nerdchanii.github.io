---
title: "When One Cache File Made Codex Behave Like Two Different Products"
tags:
  - codex
  - opensource
  - debugging
  - cache
---

### How identical app-server binaries received different model catalogs—and why subagent tools appeared and disappeared

I started with a simple but confusing symptom: Codex subagent tools were unavailable in some sessions, even though multi-agent support was enabled.

In one session, Codex said it could not spawn an agent because the necessary tools were not exposed. Later, under what appeared to be the same setup, those tools were available.

My first report, [issue #33559](https://github.com/openai/codex/issues/33559), described that broad symptom. At first, it looked like a straightforward tool-exposure bug.

It was not.

The deeper investigation led to [issue #33593](https://github.com/openai/codex/issues/33593): two app-server processes running the exact same Codex binary could receive different model catalogs and continuously overwrite the same local cache file.

The bug was not simply “V1 versus V2.” It was a mismatch between the identity used to request a model catalog and the identity used to cache it.

## A model catalog is more than a list of models

Codex downloads a model catalog from the ChatGPT Codex backend.

That catalog does not just say which models exist. It also contains runtime metadata that can change how Codex behaves, including fields such as:

```text
multi_agent_version
tool_mode
use_responses_lite
supports_search_tool
```

Those fields can affect:

- whether multi-agent V1 or V2 is selected;
- whether tools are exposed directly or discovered through Tool Search;
- whether Responses Lite is used;
- which tools the model can see and call.

This means two catalogs containing the same model name can still produce very different product behavior.

## The first hypothesis: two different app-server versions

Two local app-server processes were running:

- one associated with Codex Desktop;
- another started by the ChatGPT Chrome extension’s native host.

The obvious explanation was version skew. Perhaps Desktop and the Chrome extension had installed different versions of the Codex app server.

That hypothesis was wrong.

Both processes reported:

```text
codex-cli 0.144.5
```

The executable files also had the same SHA-256 hash and were byte-for-byte identical.

They used the same:

- Codex binary;
- `CODEX_HOME`;
- ChatGPT account;
- authentication mode;
- provider;
- token;
- client version;
- request URL;
- User-Agent.

Only one important value differed: `originator`.

## The actual difference: originator

In this context, the originator identifies the client surface making the request.

Examples include:

```text
Codex Desktop
codex_cli_rs
codex-chrome-extension-sidepanel
codex_vscode
codex_sdk_ts
```

Direct requests to the same endpoint, changing only the originator, returned different ETags and different runtime metadata. All three requests below resolved to the same model, GPT-5.6 Sol—only the multi-agent version and tool mode assigned to that model differed by originator:

| Originator                         | GPT-5.6 Sol multi-agent version | Tool mode        |
| ----------------------------------- | -----------------------: | ----------------- |
| `Codex Desktop`                    |                       V1 | `direct`         |
| `codex_cli_rs`                     |                       V1 | `direct`         |
| `codex-chrome-extension-sidepanel` |                       V2 | `code_mode_only` |

The Desktop and CLI responses shared one ETag. The Chrome side-panel response had another.

Both responses were valid. The problem was that Codex treated them as interchangeable when storing them locally.

## One shared file, two incompatible answers

Both app-server processes wrote their catalog to:

```text
~/.codex/models_cache.json
```

The cache was primarily validated using the client version and freshness TTL. It did not include the originator in its identity.

The resulting behavior was:

```text
same binary and client version
+ different originator
→ different server catalog

different catalogs
+ one shared cache file
→ last writer wins
```

The Desktop process could write the V1 catalog. A few seconds later, the Chrome process could replace it with V2. Desktop could then read and accept the Chrome-produced cache because the client version still matched.

The file itself did not need to be malformed. It could contain perfectly valid JSON and still contain the wrong catalog for the process reading it.

This is semantic cache contamination: the cached answer is valid, but it belongs to a different request identity.

## Why the cache kept changing

This was not only a one-time startup race.

Merged [PR #28699](https://github.com/openai/codex/pull/28699) added an app-server worker that refreshes the model catalog immediately and then approximately every three minutes.

That change had a useful goal: keep the model list warm so users do not have to wait for a network request when starting a thread.

But with two long-lived app servers sharing one cache file, it amplified the identity bug:

```text
Desktop refresh → V1 written
Chrome refresh  → V2 written
Desktop refresh → V1 written
Chrome refresh  → V2 written
```

What would otherwise have been occasional last-writer-wins contamination became a recurring oscillation.

There is also a genuine startup race in the same code. The app-server models refresh worker is spawned in `MessageProcessor::new`, before the JSON-RPC `initialize` handler calls `set_default_originator`; until that call happens, `originator()` returns the built-in default, `codex_cli_rs`. So even a single process can perform its first catalog fetch—and cache write—under the wrong identity. This is why the fix described later insists that the refresh worker start only after the app-server identity is known.

## How the code evolved into this state

No single pull request introduced the entire bug. It emerged from several individually reasonable changes.

- [PR #7722](https://github.com/openai/codex/pull/7722) introduced the disk model cache, TTL and ETag storage.
- [PR #8491](https://github.com/openai/codex/pull/8491) added refresh behavior for ETag changes.
- [PR #8873](https://github.com/openai/codex/pull/8873) and [PR #8988](https://github.com/openai/codex/pull/8988) connected the app-server client name to the HTTP originator.
- [PR #9174](https://github.com/openai/codex/pull/9174) renewed cache freshness when the ETag matched.
- [PR #10414](https://github.com/openai/codex/pull/10414) rejected caches from incompatible Codex client versions.
- [PR #18950](https://github.com/openai/codex/pull/18950) moved model discovery under model providers.
- [PR #28699](https://github.com/openai/codex/pull/28699) added the recurring background refresh worker.

An automated review on [PR #18950](https://github.com/openai/codex/pull/18950#pullrequestreview-4158982727) warned that the cache needed provider identity or separate cache files. The PR was later approved and merged, but that isolation was not included in the merged change. To be fair, the warning came from an automated reviewer, buried among many bot comments—easy to miss. The lesson is less about any individual review and more about process: automated P1 warnings need a path to being either incorporated or explicitly dismissed.

More recently, draft [PR #30984](https://github.com/openai/codex/pull/30984) proposed adding provider ID, authentication mode and account ID to cache eligibility. That addresses an important part of the problem, but not this reproduction: both processes used the same provider, auth mode and account. Their originators were different.

A single cache file also means that merely rejecting a mismatched entry is incomplete. One surface still evicts the other surface’s catalog and destroys its offline state.

## Why this affected subagent tools

The model catalog determines which multi-agent and tool-planning route Codex uses.

If one surface receives:

```text
multi_agent_version = v1
tool_mode = direct
```

while another receives:

```text
multi_agent_version = v2
tool_mode = code_mode_only
```

then newly started sessions can expose different tool surfaces depending on which catalog they load. In V1 with `direct`, the planner exposes subagent tools directly. But when V1 runs with Responses Lite, collaboration tools are deferred behind Tool Search—and [issue #32086](https://github.com/openai/codex/issues/32086) shows that the `tool_search` entrypoint itself can be serialized out of reach. The catalog a session loads therefore decides whether it lands on a working route or the broken one.

That explains why subagent tools could appear unavailable in one session and available in another without changing the Codex binary.

However, this investigation also showed that there are two separate bugs.

### Bug 1: unstable catalog selection

[Issue #33593](https://github.com/openai/codex/issues/33593) covers the upstream cache-identity problem.

It explains how a client can unexpectedly receive V1 or V2 metadata because different surfaces overwrite and reuse the same cache slot.

### Bug 2: V1 Tool Search serialization

[Issue #32086](https://github.com/openai/codex/issues/32086) covers a downstream problem.

Once V1 with Responses Lite is selected, collaboration tools may be deferred behind Tool Search. But `tool_search` can itself be serialized in a way that leaves those deferred tools unreachable.

Fixing cache isolation would make route selection stable. It would not make the V1 route work correctly if the server intentionally selected V1.

Conversely, fixing V1 Tool Search would not stop different surfaces from overwriting each other’s catalogs.

Both layers need to be addressed.

## Does this corrupt an existing conversation?

Not immediately.

A running Codex process keeps its own in-memory model catalog. If another process changes `models_cache.json`, the current process does not automatically hot-reload that file in the middle of a request.

An in-flight turn therefore continues with the context and tool definitions it already received.

The situation becomes more subtle when the running app server performs its own remote catalog refresh:

- the current turn remains a fixed snapshot;
- the thread’s selected multi-agent version can become fixed after its first resolution;
- other model metadata can be consulted again when later turns are created;
- the tool schema sent to the model is planned per turn.

This creates the possibility of a hybrid state: a thread may retain one multi-agent runtime selection while later turns receive model metadata associated with another catalog.

## What about prompt caching?

The local model catalog cache and the server-side prompt cache are different systems.

Changing `models_cache.json` does not directly corrupt conversation history or the server’s stored prompt prefix.

However, if a later turn uses a different tool schema, system prefix or request format, the serialized prompt is no longer identical. That can reduce prompt-cache reuse and lower `cached_input_tokens`.

The likely result is a cache miss, increased latency or higher token usage—not a corrupted conversation.

This is a plausible secondary impact, but it should be measured from session usage logs before being presented as a confirmed consequence.

## Related reports show the wider pattern

The shared model cache has surfaced in several adjacent reports. Grouping them by cause and effect—rather than as a flat list—shows the same underlying pattern.

The first group is contention and corruption of the one shared cache file. Multiple writers hitting a single path produce truncated or EOF cache reads ([#30864](https://github.com/openai/codex/issues/30864)), excessive write churn ([#32496](https://github.com/openai/codex/issues/32496)), and stale runtimes overwriting each other's catalogs ([#32482](https://github.com/openai/codex/issues/32482)). [#33146](https://github.com/openai/codex/issues/33146) is related but distinct: a stale cache written by client version 0.142.3 disagreeing with the bundled catalog of the running 0.144.4—client-version skew surfacing through the same shared file.

The second group is the runtime symptoms that contention exposes. When the metadata a process holds no longer matches the metadata on disk, a running UI can disagree with a freshly fetched catalog ([#32850](https://github.com/openai/codex/issues/32850)), and MCP tools can disappear after runtime metadata changes ([#33547](https://github.com/openai/codex/issues/33547), [#33575](https://github.com/openai/codex/issues/33575))—the same class of tool-loss this article traces to the identity mismatch. Notably, a user in [#33547](https://github.com/openai/codex/issues/33547) worked around the problem with the `CODEX_INTERNAL_ORIGINATOR_OVERRIDE` environment variable—independent corroboration that the behavior depends on the originator. And [#33575](https://github.com/openai/codex/issues/33575) reports that OpenAI mitigated the Sol symptom server-side by flipping `tool_mode` to `code_mode_only`; that removes the visible divergence for that model, but the cache-identity defect underneath remains.

These reports do not all share one root cause, but the cause-to-symptom chain is consistent: a single globally interchangeable cache file cannot represent the distinct identities the server actually serves, so the model catalog should not be treated as one globally interchangeable object.

## A durable fix, proven locally

The root cause has a single-sentence remedy: the cache key must include every request dimension that can change the server response. In this bug the missing dimension was the originator, but the full identity tuple is broader:

```text
provider
+ endpoint identity
+ effective authentication mode
+ account or principal
+ exact originator/client surface
+ compatible client version
```

The simplest durable storage design gives each identity its own cache slot, with the identity tuple hashed rather than exposing account information in the filename:

```text
$CODEX_HOME/models_cache/<identity-hash>.json
```

Each slot independently owns its model catalog, its ETag and its freshness timestamp. Isolation alone is not enough, though: the writes also need atomic temporary-file replacement, same-key cross-process coordination, a refresh worker that starts only after the app-server identity is known, no full rewrite for a matching-ETag renewal, and in-memory catalog state partitioned by the same identity.

To confirm the direction, I built a local proof of concept that keyed the cache by originator:

```text
CODEX_HOME/models_cache/<sha256(originator)>.json
```

The prototype stores the originator inside each cache entry, rejects legacy or mismatched entries, updates only the correct originator's TTL, and writes to a temporary file before atomically replacing the destination. The targeted model-manager and core TTL tests passed. It is not yet an upstream pull request, and originator alone is not the complete final identity—provider, account and endpoint isolation still matter.

The regression test behind it needs no real ChatGPT account. It runs two separate model-manager processes against a mock `/models` endpoint under one temporary `CODEX_HOME`, serving two originators with two different ETags and catalogs. The core scenario alternates refreshes between the two originators, restarts both managers in offline mode, and verifies that each originator recovers its own catalog with complete, parseable JSON. Additional cases inject failure during file replacement, exercise the race between app-server initialization and the first refresh, and separately cover the V1 Tool Search behavior from [issue #32086](https://github.com/openai/codex/issues/32086).

## The broader lesson

Client version equality was not enough. Binary equality was not enough. Account and provider equality were not enough.

The server was allowed to return different catalogs for different client surfaces, but the local cache had nowhere to represent that distinction. Once multiple processes began refreshing that shared file in the background, a hidden identity mismatch became visible as unstable multi-agent behavior.

There is also a deeper limit worth naming: a client cannot enumerate every dimension that changes a server response. The ChatGPT plan tier, for example, is a claim inside the JWT bearer token—invisible to any header-based cache key, and absent even from the provider, auth-mode and account-ID key proposed in draft [PR #30984](https://github.com/openai/codex/pull/30984). Past some point, the server should declare its variation, in the spirit of HTTP `Vary`, or the client should lean on per-identity ETag validation rather than an ever-growing hand-maintained key.

What looked like a missing-tool problem was actually a chain:

```text
originator-specific server response
→ shared last-writer-wins cache
→ unstable V1/V2 metadata
→ different tool planning
→ missing or unreachable subagent tools
```

The new root-cause report is open as [#33593](https://github.com/openai/codex/issues/33593). The separate V1 Tool Search regression remains open as [#32086](https://github.com/openai/codex/issues/32086), and draft [PR #30984](https://github.com/openai/codex/pull/30984) is an important step toward better cache scoping—but originator must also be part of the design.
