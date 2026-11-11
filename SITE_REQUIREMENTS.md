# IR office site — pages & requirements still needed

These are the pages an AI builder usually skips because they aren't "exciting", but a real university International Relations office site needs them. They're grouped by why you need them, with the ones specific to an IR office marked ⭐.

**If you only build five of these, prioritize:** program detail pages, how to apply, forms & downloads, privacy policy, and a CMS. Without those, the site looks good but doesn't actually help a student apply.

---

## 1. Inner pages the homepage promises

Every "Learn more", "Register" and "Read story" link needs somewhere to go.

| Page | Why it's needed |
|---|---|
| **Partner directory** + individual partner pages | The globe can't hold every detail. Each partner page shows its programs, MoU validity, eligibility and seats. |
| **Program detail pages** (one per program) | Eligibility, duration, fees, credit transfer, timeline and documents. This is what students actually read before applying. |
| ⭐ **How to apply / nomination process** | A step-by-step procedure with internal deadlines and who signs what. It's the most-asked question an IR office gets. |
| ⭐ **Forms & downloads library** | Nomination form, NOC, learning agreement, credit transfer form, travel undertaking, report templates. |
| **Events list + event detail + registration** | The Register buttons need a real form, a confirmation, and an add-to-calendar option. |
| **News list + article page** | MoU announcements, delegation visits, results. |
| **Student stories list + story page** | Full write-ups, linked to the partner and program. |
| ⭐ **For international (inbound) students** | Admissions, accommodation, FRRO registration, arrival guide, campus life. It's a different audience from outbound students. |
| ⭐ **For partner institutions** | An institutional fact sheet, MoU proposal process, delegation visit request form, and the IR contact person. Partner universities expect this. |
| ⭐ **Pre-departure & return guide** | Visa, insurance, packing, banking, then credit transfer and reporting after return. |
| ⭐ **Emergency & student safety** | 24×7 emergency contact for students abroad, what to do in a crisis, and embassy links. Easy to forget, but critical. |
| **Team / contact directory** | Who handles what (outbound, inbound, MoUs), with official emails and office hours. |
| **Full FAQ page** | The homepage FAQ only shows 5–8 questions. |
| **Search results page** | You have a search box, so results need a page. |

---

## 2. Legal & compliance pages

- **Privacy policy:** your forms collect names, emails and registration numbers. In India this falls under the **DPDP Act 2023**, so you need to state what you collect, why, how long you keep it, and how to request deletion.
- **Cookie / analytics consent notice:** needed if you use Google Analytics or similar.
- **Terms of use** and a **disclaimer:** "Program details, seats and deadlines are subject to change; the official notice prevails." This protects the office if the site goes out of date.
- **Grievance / data request contact:** a named contact for privacy complaints.
- **Accessibility statement:** your WCAG level, known issues, and how to report a problem.
- **Credits & licenses:** illustrations (Open Peeps is CC0, but crediting it is good practice), fonts, photos, and student photo consent.
- **Refund policy:** only if any event or program fee is paid through the site.

Have the university's legal or IT team review these pages. This is not legal advice, and VIT likely has standard wording you're expected to reuse.

---

## 3. System pages

- **404** (styled in your theme, with links back to Programs, Partners and Contact) and a **500 / error page**
- **Maintenance page**
- **Form success / thank-you pages** for registration, contact and enquiry, plus **confirmation emails**
- **Empty states:** no events right now, no partners match the filter, no search results
- **HTML sitemap**, plus behind-the-scenes files: `sitemap.xml`, `robots.txt`, favicon, web manifest, and **Open Graph images** so links shared on WhatsApp or LinkedIn show a proper preview

---

## 4. Non-functional requirements

These aren't pages, but they're requirements nobody builds unless asked:

- **A CMS or admin panel:** the most important one. The IR office must be able to add events, news, partners and deadlines without a developer, otherwise the site goes stale within months. Options include Sanity, Strapi, or a simple Google Sheet feeding the data. Registrations should be exportable to Excel.
- **Accessibility:** WCAG 2.1 AA, keyboard navigation, alt text, and reduced-motion support (your globe and journey animations need this).
- **Performance:** the globe, canvas and illustrations must stay fast on phones and on campus Wi-Fi. Lazy-load anything below the fold.
- **SEO:** a unique title and description per page, structured data for events and the organization, and clean URLs (`/partners/germany/tu-munich`).
- **Security:** form spam protection (CAPTCHA or honeypot), rate limiting, HTTPS, and validation on the server, not only in the browser.
- **Content freshness:** "Last updated" dates on deadline and program pages, and auto-hiding past events.
- **Analytics:** to see which programs and partners get the most interest. Gate it behind the cookie consent above.
- **Print-friendly styles** for forms and program pages, since students often print checklists.
- **Branding compliance:** check that the logo usage and naming follow VIT's official guidelines before going live.

---

## Suggested build order (top 5 first)

1. Program detail pages  
2. How to apply / nomination process ⭐  
3. Forms & downloads library ⭐  
4. Privacy policy  
5. CMS / admin so the office can update content without a developer  
