import { profile } from "@/data/resume";
import { ResumeDocument } from "@/text/ResumeDocument";
import { WorldStageLoader } from "@/world/WorldStageLoader";

/**
 * Both layers are in the served HTML. Which one is visible is decided before
 * first paint by the inline script in the layout, and can be changed at any
 * time by the visitor — from the world through "Read as text", from the
 * document through "Enter the world".
 *
 * The escape to the written CV lives in the HUD rather than here, because a
 * plain `#resume` anchor would point at a hidden element while the world is on
 * screen. Visitors without scripts need no such link: for them the document is
 * simply the page.
 */
export default function Page() {
  return (
    <>
      {/* Painted from the first frame so entering the world is a fade up out of
          the dark rather than a flash of the document behind it. Non-JS
          visitors never see it: the stylesheet only shows it once the inline
          script has marked scripts as available. */}
      <div className="boot" aria-hidden="true">
        <p className="boot__name">{profile.shortName}</p>
        <p className="boot__role">{profile.role}</p>
      </div>

      <WorldStageLoader />
      <ResumeDocument />
    </>
  );
}
