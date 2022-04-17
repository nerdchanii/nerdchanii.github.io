import React from "react";
import Card from "../components/Card";
import PageTitle from "../layout/PageTitle";
import profile from "../assets/image/profile1.jpeg";

function About() {
  return (
    <div>
      <PageTitle title="About me" />
      <Card
        title="Hello, I'm a front-end developer"
        text="I am a full stack developer with a passion for learning and building things that help people. I have a background in business and finance, but I am also a self-taught developer. I am currently working on a full-stack web application for a local business. I am looking for a position where I can utilize my skills and experience to help others."
        img={profile}
      />
    </div>
  );
}

export default About;
