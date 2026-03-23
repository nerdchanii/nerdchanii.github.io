---
aliases:
  - MCQA Project 회고
  - Generative Based MCQA
tags:
  - MCQA
  - boostcamp
  - RAG
  - reading-log
  - GenerativeModel
---

# MCQA 프로젝트 회고

이번 프로젝트는 생성형 모델을 활용한 **「수능형 문제 풀이 모델 생성」**이었다. 국어/사회분야의 다지선다 문제를 푸는 **MCQA(Multiple-Choice Question Answering)** 테스크였다.

## 담당 역할

프로젝트 초반에는 **EDA 보조**와 **FastLanguageModel 기반 학습 환경 구축**을 맡았고, 중반부터는 **API 기반 inference flow 구성**과 **RAG 시스템 구축**을 담당했다. 

### EDA 보조 : Tracing the Origins of the Training Data

데이터 전처리에 참여했다. 우리에게 주어진 문제는 기존에 존재하던 몇가지 데이터셋을 GPT-4o를 이용해 augmentation한 자료였고, 지문과 문제들의 출처를 다시 태깅할 수 있도록 source tagging을 담당했다. data Leaks의 문제가 발생할 수 있어, 

---

### Training Environment 구축

주어진 백본 모델들을 폭넓게 탐색해야 했기 때문에 FastLanguageModel을 도입했다. 문제는 **지원 여부가 모델마다 달라**, FastLanguageModel로 로드가 실패할 경우를 대비해 **fallback으로 Hugging Face에서 로드하는 구조**를 함께 만들었다. **FastLanguageModel**은 torch 동작을 최적화하는 요소가 있어 **torch/cuda 버전 조합에 따라 환경 이슈가 자주 발생**했다. 이 과정을 통해 라이브러리 버전 관리(versioning)와 재현 가능한 환경 설정의 중요성을 직접 경험했다. 이 부분은 시간여유가 조금 생길때 어떤 식으로 torch의 연산을 개선시키는 살펴봐야겠다.

---

### RAG 시스템 구축

모델에 외부 지식을 주입하는 방식은 크게 **fine-tuning**과 **RAG**로 나눌 수 있다. 이번 프로젝트에서는 다른 팀원이 fine-tuning을 담당했고, 나는 RAG 시스템 구축을 맡았다.

RAG를 도입하기로 결정했을 때 남은 시간이 약 2주 정도였고, 현실적으로 구현 가능한 형태를 검토했다. 후보는 **Naive RAG**, **Advanced RAG**, 그리고 Agentic Flow 기반의 **tool-calling 형태로 사용하는 RAG**였다. 결과적으로 우리는 **Query Planning을 활용한 Advanced RAG** 방향으로 정했다. 

Advanced RAG를 결정한 이유는 다음과 같다. 우선 우리는 문제를 풀기위해서 질문과 지문, 선지를 활용에 질문에 대답할 수 있도록 필요한 정보들을 보강해야 했다. 그래야 모델에게 문제풀기위한 정보를 노이즈를 최소화하며 잘 전달 해줄 수 있을 것이라고 판단했다.

### Advanced RAG (Query Planning)

문제를 풀기 위해 필요한 정보를 더 잘 찾을 수 있도록, **질문에서 필요한 검색 단서를 뽑아 쿼리를 설계하고(계획하고) 확장**하는 방식을 적용했다.  즉, 하나의 질문을 그대로 검색에 쓰기보다, 문제 해결에 필요한 정보 단위를 기준으로 **여러 개의 검색 쿼리를 계획적으로 구성**해 Retrieval 성능을 높이려 했다.

다만 구현한 구조는 **corrective fallback(재계획/재생성/재검색)** 을 포함하지 못했다. 쿼리 계획이 잘못되거나 retrieval 결과가 부정확할 때, 다시 쿼리를 세우고 검색을 반복하는 루프를 구성하지 못한 점은 아쉬움으로 남는다.

---

## 아쉬운 점

### 1) Local DB 구축

- 로컬 DB를 한국사 영역에 대해서만 구축했다. (데이터 수집을 직접 맡지는 않았지만) DB로 사용할 수 있는 자료가 제한적이라는 판단이 내려졌을 때 아쉬움이 컸다.
    
- Wikipedia 같은 비교적 범용적인 코퍼스라도 초기에 DB로 구축해두었다면, 최소한의 안정적인 retrieval 기반을 만들 수 있었을 것 같다.

### 2) Metric 부재

- pre-retrieval / retrieval / post-retrieval 각 단계에 대한 **평가 지표를 체계적으로 만들지 못했다**.
    
- LangSmith로 샘플 10~20개를 확인하며 쿼리 분해 품질을 점검하긴 했지만, 최소한 **LLM-as-a-Judge 기반 평가**나 간단한 정량 지표(예: retrieval hit rate, passage redundancy, answer consistency 등)를 마련했다면 개선 방향을 더 빠르게 잡을 수 있었을 것 같다.
