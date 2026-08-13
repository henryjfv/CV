import {
  careerHighlights,
  certifications,
  education,
  experience,
  profile,
  skills,
} from "@/data/resume";
import { EmailLink, PrintButton } from "./ContactActions";

/**
 * The written CV.
 *
 * This is not a degraded fallback. It is a Server Component, so it ships inside
 * the served HTML for crawlers and for anyone without WebGL; it is what the
 * print sheet formats; and it is reachable at any time from the world through
 * the skip link and the HUD. The 3D layer and this one render the same objects
 * from `resume.ts` — there is no second copy of the content to keep in sync.
 */
export function ResumeDocument() {
  return (
    // tabIndex lets the world hand the keyboard over when the visitor leaves it.
    <main id="resume" className="doc" tabIndex={-1}>
      <header className="doc__header">
        <p className="doc__eyebrow">{profile.availability}</p>
        <h1 className="doc__name">
          {profile.firstName} <span>{profile.lastName}</span>
        </h1>
        <p className="doc__role">{profile.role}</p>
        <p className="doc__meta">
          {profile.location}
          <span aria-hidden="true"> · </span>
          {profile.english}
          <span aria-hidden="true"> · </span>
          <EmailLink className="doc__link" />
        </p>
        <p className="doc__summary">{profile.summary}</p>
        <p className="doc__actions">
          <a
            className="doc__action"
            href={profile.links.linkedin}
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn
          </a>
          <a
            className="doc__action"
            href={profile.links.github}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <PrintButton />
        </p>
      </header>

      <section className="doc__section" aria-labelledby="highlights-heading">
        <h2 id="highlights-heading">Career highlights</h2>
        <dl className="doc__highlights">
          {careerHighlights.map((highlight) => (
            <div key={highlight.title}>
              <dt>{highlight.title}</dt>
              <dd>{highlight.detail}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="doc__section" aria-labelledby="experience-heading">
        <h2 id="experience-heading">Experience</h2>
        {experience.map((job) => (
          <article key={job.id} className="doc__entry">
            <div className="doc__entry-head">
              <h3>{job.title}</h3>
              <p className="doc__period">{job.period}</p>
            </div>
            <p className="doc__context">{job.context}</p>
            {job.summary ? <p className="doc__role-summary">{job.summary}</p> : null}
            <ul>
              {job.highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="doc__section" aria-labelledby="skills-heading">
        <h2 id="skills-heading">Skills</h2>
        <div className="doc__skills">
          {skills.map((group) => (
            <div key={group.id} className="doc__skill-group">
              <h3>{group.category}</h3>
              <p>{group.items.join(" · ")}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="doc__section" aria-labelledby="education-heading">
        <h2 id="education-heading">Education</h2>
        {education.map((item) => (
          <article key={item.institution} className="doc__entry">
            <div className="doc__entry-head">
              <h3>{item.institution}</h3>
              <p className="doc__period">{item.period}</p>
            </div>
            <p className="doc__context">{item.detail}</p>
          </article>
        ))}
      </section>

      <section className="doc__section" aria-labelledby="certifications-heading">
        <h2 id="certifications-heading">Certifications</h2>
        <ul className="doc__certs">
          {certifications.map((cert) => (
            <li key={cert.name}>
              <span className="doc__cert-name">{cert.name}</span>
              <span className="doc__cert-meta">
                {cert.issuer}
                {cert.year ? ` · ${cert.year}` : ""}
              </span>
              {/* Only the two certificates that carry no national ID number
                  have an image to link to. */}
              {cert.image ? (
                <a
                  className="doc__link"
                  href={cert.image.src}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View certificate
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
