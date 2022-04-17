import React from "react";
import Card from "../components/Card";
import PageTitle from "../layout/PageTitle";
import profile from "../assets/image/profile1.jpeg";

function About() {
  return (
    <div>
      <PageTitle title="About me" />
      <Card
        title="Hello!🧑🏻‍💻 I'm a front-end developer"
        text={text}
        img={profile}
      />
    </div>
  );
}

export default About;

const text = `프론트 엔드 개발자 김예찬입니다.
개발자로서 세상을 보다 살기좋고 행복한 곳으로 만들고 싶습니다.`;
