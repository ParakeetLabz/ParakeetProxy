(() => {
  const form = document.getElementById("dmca-notice-form");
  if (!form) return;
  const feedback = document.getElementById("dmca-notice-feedback");
  const mailWrap = document.getElementById("dmca-notice-mailto-wrap");
  const inbox = "dmca@vel.lol";

  const toggleErr = (on) => {
    if (!feedback) return;
    feedback.classList.toggle("is-error", !!on);
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!feedback || !mailWrap) return;

    toggleErr(false);
    feedback.textContent = "";
    mailWrap.hidden = true;
    mailWrap.innerHTML = "";

    const hp = form.querySelector('[name="_hp"]');
    if (hp && hp.value.trim()) return;

    const fd = new FormData(form);
    const roleRaw = fd.get("role");
    const payload = {
      subject_line: String(fd.get("subject_line") || "").trim(),
      legal_name: String(fd.get("legal_name") || "").trim(),
      claimant_email: String(fd.get("claimant_email") || "").trim(),
      phone: String(fd.get("phone") || "").trim(),
      mailing_address: String(fd.get("mailing_address") || "").trim(),
      role: typeof roleRaw === "string" ? roleRaw.trim() : "",
      copyrighted_work: String(fd.get("copyrighted_work") || "").trim(),
      infringing_identification: String(
        fd.get("infringing_identification") || "",
      ).trim(),
      ownership_proof: String(fd.get("ownership_proof") || "").trim(),
      signature_name: String(fd.get("signature_name") || "").trim(),
      affirmation_good_faith: form.querySelector(
        '[name="affirmation_good_faith"]',
      )?.checked === true,
      affirmation_accurate:
        form.querySelector('[name="affirmation_accurate"]')?.checked === true,
      _hp: hp ? hp.value : "",
    };

    form.querySelector('button[type="submit"]')?.setAttribute(
      "disabled",
      "disabled",
    );
    feedback.textContent = "Sending…";

    try {
      const res = await fetch("/api/dmca-notice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }
      if (res.status === 204) return;

      if (!res.ok) {
        toggleErr(true);
        feedback.textContent =
          typeof data.error === "string" && data.error
            ? data.error
            : "Could not send. Try emailing directly.";
        return;
      }

      toggleErr(false);
      if (data.mailed === true) {
        feedback.textContent = `Relayed to our Discord team and a copy was emailed to ${inbox}.`;
      } else {
        feedback.textContent = `Relayed to our Discord team. Use the button below to open your mail app to ${inbox} with your notice prefilled if you still need an email trail.`;

        const subj = `Proof of ownership — ${payload.subject_line}`.slice(
          0,
          780,
        );
        const cap =
          payload.role === "agent"
            ? "Authorized agent"
            : "Copyright owner";
        const mb = [
          `Subject headline: ${payload.subject_line}`,
          `Legal name: ${payload.legal_name}`,
          `Capacity: ${cap}`,
          `Reply-to: ${payload.claimant_email}`,
          payload.phone ? `Phone: ${payload.phone}` : null,
          payload.mailing_address
            ? `Mailing address: ${payload.mailing_address}`
            : null,
          "",
          "Copyrighted work(s):",
          payload.copyrighted_work,
          "",
          "Allegedly infringing URLs / descriptions:",
          payload.infringing_identification,
          "",
          "Proof of ownership / authority:",
          payload.ownership_proof,
          "",
          `Electronic signature: ${payload.signature_name}`,
        ]
          .filter((x) => x !== null && x !== undefined)
          .join("\n")
          .slice(0, 5500);

        const mailtoHref = `mailto:${inbox}?subject=${encodeURIComponent(
          subj,
        )}&body=${encodeURIComponent(mb)}`;
        const a = document.createElement("a");
        a.href = mailtoHref;
        a.className = "legal-dmca-mailto-btn";
        a.textContent = `Send email copy to ${inbox}`;
        mailWrap.appendChild(a);
        mailWrap.hidden = false;
      }

      form.reset();
    } catch {
      toggleErr(true);
      feedback.textContent =
        "Network error. Retry or send your notice manually by email.";
    } finally {
      form.querySelector('button[type="submit"]')?.removeAttribute(
        "disabled",
      );
    }
  });
})();
