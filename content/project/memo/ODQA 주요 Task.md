---
tags:
  - ODQA
  - MRC
---
## MRC(Machine Reading Comprehension)

MRC란 기계독해 테스크를 말한다. 특히 주어진 특정 문맥(context)이나 문서 내에서 질문에 대한 답을 찾는 것을 목표로 한다. 답이 항상 주어진 텍스트 안에 존재하며, 시스템은 해당 텍스트를 이해하고 정답을 정확히 찾는 문제다.

MRC 테스크는 Multi-choice MRC Task, Extraction based MRC, Generation Based MRC등이 있는 듯하다.
- Multi-choice MRC Task (선지형)
- Extraction-based MRC (텍스트 안에서 정답위치,단어 추출)
- Generation-based MRC (텍스트를 바탕으로 자연어 답 생성)

## ODQA

ODQA란 Open Domain Question Answering의 약자로, 질문이 주어졌을때 사전구축된 방대한 DB에서(우리의 경우 미리 구축한 wikipeida corpus) 질문에 해당하는 적절한 지문을 찾아 질문에 답을 하는 기술이다.

---

## ODQA = Retrival + Reading

현재 ODQA Task를 진행하고 있다. 베이스라인 코드를 보면서 "어디를 개선해야 성능을 개선할 수 있을까?" 고민하게 되었다. 공부를 진행하며 ODQA Task는 두가지 주요 Phase로 이루어져있다고 생각하게 됐다. 
### Retriveal Phase
- 질문에 해당하는 컨텍스트를 대규모 corpus에서 얼마나 잘 찾을 수 있는가? 
### Reading Phase (MRC)
- 질문과 질문을 이용해 찾은 컨텍스트를 통해서 얼마나 정확하게 리딩(MRC task)을 수행할 수 있는가? 


MRC의 평가결과가 아무리 좋다고 할지라도, 질문에 해당하는 올바른 context를 제공할 수 없다면 ODQA Task를 제대로 수행할 수 없다.

반대로,적절한 컨텍스트를 잘 찾더라도 MRC의 성능이 떨어진다면 올바른 결과를 얻을 수 없다.

