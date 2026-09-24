/**
 * 태그 URL 조각. 대소문자·공백 차이는 같은 태그로 본다.
 * Obsidian 중첩 태그(`a/b`)도 한 조각이 되도록 `/`는 `-`로 바꾼다.
 */
export function tagSlug(tag: string): string {
  return tag
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/[\s/]+/g, "-")
    .replace(/[?#%\\"'<>`^{}|.]/g, "")
}

export const tagUrl = (tag: string) => `/tags/${tagSlug(tag)}`
