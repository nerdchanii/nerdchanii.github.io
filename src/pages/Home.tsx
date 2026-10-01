import LineRoom from "../components/LineRoom.tsx"
import Seo from "../components/Seo.tsx"
import Timeline from "../components/Timeline.tsx"
import { localize, type Lang } from "../lib/i18n.ts"
import { HOME } from "../lib/profile.ts"

export default function Home(props: { lang: Lang }) {
  return (
    <>
      <Seo
        path={localize(props.lang, "/")}
        lang={props.lang}
        bilingual
        description={HOME.description[props.lang]}
      />
      <LineRoom lang={props.lang} />
      <div id="timeline">
        <Timeline lang={props.lang} />
      </div>
    </>
  )
}
