import React from "react";
import Card from "../components/Card";
import PageTitle from "../layout/PageTitle";
import profile from "../assets/image/profile1.jpeg";
import FullPageArticle from "../layout/FullPageArticle";

function About() {
  return (
    <>
      <div
        style={{
          scrollSnapAlign: "center",
          display: "flex",
          flexDirection: "row",
          height: "100vh",
          width: "100vw",
        }}
      >
        <PageTitle title="About me" />
        <Card
          title="Hello!🧑🏻‍💻 I'm a front-end developer"
          text={text}
          img={profile}
        />
      </div>
      <div style={{ scrollSnapAlign: "center" }}>
        <PageTitle title="About me" />
        <Card
          title="Hello!🧑🏻‍💻 I'm a front-end developer"
          text={text}
          img={profile}
        />
      </div>
    </>
  );
}

export default About;

const text = `프론트 엔드 개발자 김예찬입니다.
개발자로서 세상을 보다 살기좋고 행복한 곳으로 만들고 싶습니다.`;

const styles = {
  full: {
    scrollSnapAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto",
    padding: "1rem 1rem",
    height: "100vh",
    width: "100vw",
    background: "#f0f0f0",
    top: "5vh",
  },
  scroll: {
    scrollSnapType: "y mandatory",
  },
};
