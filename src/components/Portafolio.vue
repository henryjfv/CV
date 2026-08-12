<template>
  <div id="page-top">
    <!-- Navigation-->
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary fixed-top" id="sideNav">
      <a class="navbar-brand js-scroll-trigger" href="#page-top">
        <span class="d-block d-lg-none">{{ profile.firstName }} {{ profile.lastName }}</span>
        <span class="d-none d-lg-block">
          <img class="img-fluid img-profile rounded-circle mx-auto mb-2" src="@/assets/img/fotoPerfil.jpg"
            :alt="`${profile.firstName} ${profile.lastName}`" />
        </span>
      </a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarResponsive"
        aria-controls="navbarResponsive" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarResponsive">
        <ul class="navbar-nav">
          <li class="nav-item" v-for="item in navItems" :key="item.href">
            <a class="nav-link js-scroll-trigger" :href="item.href">{{ item.label }}</a>
          </li>
        </ul>
      </div>
    </nav>

    <!-- Page Content-->
    <div class="container-fluid p-0">
      <!-- About-->
      <section class="resume-section" id="about">
        <div class="resume-section-content">
          <h1 class="mb-0">
            {{ profile.firstName }}
            <span class="text-primary">{{ profile.lastName }}</span>
          </h1>
          <div class="subheading mb-1">{{ profile.role }}</div>

          <p class="availability-banner" v-if="profile.availability">
            <span class="availability-dot" aria-hidden="true"></span>{{ profile.availability }}
          </p>

          <div class="subheading contact-line mb-3">
            <span>{{ profile.location }}</span>
            <span class="contact-separator" aria-hidden="true">·</span>
            <!-- Address is assembled on click, so the served markup carries no
                 plain-text mailto: for scrapers to pick up. -->
            <a :href="emailHref" @click.prevent="revealEmail">{{ emailLabel }}</a>
          </div>

          <p class="lead mb-4">{{ profile.summary }}</p>

          <div class="cta-row mb-4">
            <a class="btn btn-primary btn-sm" :href="emailHref" @click.prevent="revealEmail">
              <i class="fas fa-envelope" aria-hidden="true"></i> Get in touch
            </a>
            <button class="btn btn-outline-secondary btn-sm" type="button" @click="printResume">
              <i class="fas fa-file-pdf" aria-hidden="true"></i> Download PDF
            </button>
          </div>

          <div class="social-icons">
            <a class="social-icon" :href="profile.links.linkedin" target="_blank" rel="noopener noreferrer"
              aria-label="LinkedIn profile"><i class="fab fa-linkedin-in" aria-hidden="true"></i></a>
            <a class="social-icon" :href="profile.links.github" target="_blank" rel="noopener noreferrer"
              aria-label="GitHub profile"><i class="fab fa-github" aria-hidden="true"></i></a>
          </div>
        </div>
      </section>
      <hr class="m-0" />

      <!-- Experience-->
      <section class="resume-section" id="experience">
        <div class="resume-section-content">
          <h2 class="mb-5">Experience</h2>
          <div class="d-flex flex-column flex-md-row justify-content-between mb-5" v-for="job in experience"
            :key="job.title + job.period">
            <div class="flex-grow-1">
              <h3 class="mb-0">{{ job.title }}</h3>
              <div class="subheading mb-3">{{ job.context }}</div>
              <ul class="job-highlights">
                <li v-for="(highlight, i) in job.highlights" :key="i">{{ highlight }}</li>
              </ul>
            </div>
            <div class="flex-shrink-0">
              <span class="text-primary">{{ job.period }}</span>
            </div>
          </div>
        </div>
      </section>
      <hr class="m-0" />

      <!-- Education-->
      <section class="resume-section" id="education">
        <div class="resume-section-content">
          <h2 class="mb-5">Education</h2>
          <div class="d-flex flex-column flex-md-row justify-content-between mb-5" v-for="item in education"
            :key="item.institution">
            <div class="flex-grow-1">
              <h3 class="mb-0">{{ item.institution }}</h3>
              <div class="subheading mb-3">{{ item.detail }}</div>
            </div>
            <div class="flex-shrink-0">
              <span class="text-primary">{{ item.period }}</span>
            </div>
          </div>
        </div>
      </section>
      <hr class="m-0" />

      <!-- Skills-->
      <section class="resume-section" id="skills">
        <div class="resume-section-content">
          <h2 class="mb-5">Skills</h2>
          <div class="skill-group mb-4" v-for="group in skills" :key="group.category">
            <div class="subheading mb-2">{{ group.category }}</div>
            <ul class="skill-list">
              <li v-for="item in group.items" :key="item">{{ item }}</li>
            </ul>
          </div>
        </div>
      </section>
      <hr class="m-0" />

      <!-- Certifications-->
      <section class="resume-section" id="certifications">
        <div class="resume-section-content">
          <h2 class="mb-5">Certifications</h2>
          <ul class="certification-list">
            <li v-for="cert in certifications" :key="cert.name">
              <span class="certification-name">{{ cert.name }}</span>
              <span class="certification-meta">
                {{ cert.issuer }}<template v-if="cert.year"> · {{ cert.year }}</template>
              </span>
              <a v-if="cert.image" class="certification-link" :href="cert.image" target="_blank"
                rel="noopener noreferrer">View certificate</a>
            </li>
          </ul>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import {
  profile,
  experience,
  education,
  skills,
  certifications,
} from "@/data/resume.js";

export default {
  name: "MiPortafolio",
  data() {
    return {
      profile,
      experience,
      education,
      skills,
      certifications,
      navItems: [
        { href: "#about", label: "About" },
        { href: "#experience", label: "Experience" },
        { href: "#education", label: "Education" },
        { href: "#skills", label: "Skills" },
        { href: "#certifications", label: "Certifications" },
      ],
      emailRevealed: false,
    };
  },
  computed: {
    emailAddress() {
      return `${profile.email.user}@${profile.email.domain}`;
    },
    // Until the user interacts, the anchor points nowhere and shows a masked
    // label. Both only resolve to the real address on click.
    emailHref() {
      return this.emailRevealed ? `mailto:${this.emailAddress}` : "#";
    },
    emailLabel() {
      return this.emailRevealed
        ? this.emailAddress
        : `${profile.email.user} [at] ${profile.email.domain}`;
    },
  },
  methods: {
    revealEmail() {
      this.emailRevealed = true;
      // Let the label and href update before handing off to the mail client.
      this.$nextTick(() => {
        window.location.href = `mailto:${this.emailAddress}`;
      });
    },
    printResume() {
      window.print();
    },
  },
};
</script>
