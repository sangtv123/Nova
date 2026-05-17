import{a as n}from"./chunk-RDPIPYFI.js";import{u as o,y as t}from"./chunk-64CSBWC7.js";var e=o(`<div class="page admin-page">
        <h2>Admin Dashboard</h2>
        <p class="text-muted">Loading configuration\u2026</p>
      </div>`),r=o("<h2>Admin Dashboard</h2>"),i=o("<p>Secure Area \u2014 Configuration Loaded:</p>");function g(){let a=n.getCurrentMatch()?.data?.config;return a?t("div",{class:"page admin-page"},r.cloneNode(!0),i.cloneNode(!0),t("pre",{class:"config-output"},JSON.stringify(a,null,2)),t("button",{class:"btn secondary",onClick:()=>n.navigate("/")},"Go Home")):e.cloneNode(!0)}export{g as AdminPage};
