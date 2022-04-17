import React from "react";
import Text from "./Text";
function Card(props) {
  const { title, text, img } = props;

  return (
    <article style={styles.article}>
      <header style={styles.header}>
        <h3>{title}</h3>
      </header>
      <div className="section-container" style={styles.sectionContainer}>
        <section className="img-container" style={styles.section.section}>
          <img src={img} alt={title} style={styles.section.imgContianer} />
        </section>
        <section style={styles.section.textConatiner}>
          <Text>{text}</Text>
        </section>
      </div>
    </article>
  );
}

export default Card;

const styles = {
  header: {
    marginBottom: "2vh",
    width: "100%",
  },
  article: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto",
    padding: "1rem 1rem",
    maxWidth: "80%",
    border: "1px solid #ccc",
    boxShadow: "0 0 5px #ccc",
  },

  sectionContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: "30vh",

    // minHeight: "300px",
  },
  section: {
    section: {
      height: "inherit",
    },
    imgContianer: {
      height: "100%",

      boxShadow: "0 0 5px #ccc",
      borderRadius: "5%",
      objectFit: "cover",
    },
    textConatiner: {
      display: "flex",
      flexDirection: "column",
      height: "inherit",
      textAlign: "start",
      padding: "0 1rem",
      margin: "0 0",
      lineHeight: "1.5",
    },
  },
};
