import{a as I}from"./chunk-RNJRSZ7W.js";import{b as s,c as h,g as m,h as x,i as T,j as S,k as o}from"./chunk-WIAYVEE5.js";function V(e,p={}){let a={},c=s(!1),v=s(!1);for(let n in e){let t=s(e[n]),l=s(null),u=s(!1),r=s(!1),i=s(!0),f=s(!1),C=async()=>{let d=p[n];if(d){f.value=!0,v.value=!0;try{let y=Array.isArray(d)?d:[d];for(let b of y){let g=await(typeof b=="function"?b:b.validate)(t.value);if(g&&typeof g=="string")return l.value=g,i.value=!1,!1;if(g===!1)return l.value="Invalid value",i.value=!1,!1}}finally{f.value=!1,v.value=Object.values(a).some(y=>y.isValidating.value)}}return l.value=null,i.value=!0,!0};a[n]={value:t,error:l,isDirty:u,isTouched:r,isValid:i,isValidating:f,validate:C}}let k=h(()=>Object.values(a).every(n=>n.isValid.value));return{controls:a,isSubmitting:c,isValidating:v,isFormValid:k,handleSubmit:n=>async t=>{t.preventDefault(),c.value=!0;try{if((await Promise.all(Object.values(a).map(r=>r.validate()))).every(r=>r===!0)){let r={};for(let i in a)r[i]=a[i].value.value;await n(r)}}finally{c.value=!1}},register:n=>{let t=a[n];return{value:()=>t.value.value,onInput:l=>{let u=l.target,r=u.type==="checkbox"?u.checked:u.value;t.value.value=r,t.isDirty.value=!0,t.validate()},onBlur:()=>{t.isTouched.value=!0,t.validate()}}},reset:()=>{for(let n in e)a[n].value.value=e[n],a[n].isDirty.value=!1,a[n].isTouched.value=!1,a[n].error.value=null},values:Object.fromEntries(Object.entries(a).map(([n,t])=>[n,t.value])),errors:Object.fromEntries(Object.entries(a).map(([n,t])=>[n,t.error]))}}if(typeof document<"u"){let e=document.createElement("style");e.setAttribute("data-nova-style","ContactIsland.scss"),e.textContent=`.contact-form-custom {
  margin-top: 2rem;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-top: 4px solid var(--primary);
}
.contact-form-custom h3 {
  color: var(--text-main);
  letter-spacing: 1px;
  text-align: center;
  margin-bottom: 2rem;
}
.contact-form-custom .form-group {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.contact-form-custom .form-group label {
  font-size: 0.9rem;
  color: #aaa;
}
.contact-form-custom .form-group input, .contact-form-custom .form-group textarea {
  padding: 0.8rem;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: white;
  outline: none;
}
.contact-form-custom .form-group input:focus, .contact-form-custom .form-group textarea:focus {
  border-color: var(--primary);
}
.contact-form-custom .error {
  color: var(--danger);
  font-size: 0.8rem;
}
.contact-form-custom .btn.primary.submitting {
  opacity: 0.5;
  cursor: wait;
  transition: all 0.3s ease;
}
`,document.head.appendChild(e)}var w=m(`<h3>
        Send us a message
      </h3>`),R=m('<label for="contact-name-input">Your Name</label>'),F=m('<label for="contact-email-input">Email</label>'),j=m('<label for="contact-message-input">Message</label>');function N(){let e=V({name:"",email:"",message:""},{name:a=>a.length>=2||"Name must be at least 2 characters",email:a=>a.includes("@")||"Invalid email address",message:a=>a.length>=10||"Message is too short"});x(()=>{console.log("[ContactIsland] Component logic initialized")}),S(()=>{console.log("[ContactIsland] Island fully hydrated and interactive"),document.getElementById("contact-name-input")?.focus()}),T(()=>{console.log("[ContactIsland] Component being destroyed")});let p=e.handleSubmit(async a=>{console.log("Sending data:",a),await new Promise(c=>setTimeout(c,2e3)),window.dispatchEvent(new CustomEvent("nova:toast",{detail:{message:`Thank you ${a.name}! Your message has been sent.`,type:"success"}}))});return o("div",{class:"interactive-island contact-form-custom","data-island":"contact"},w.cloneNode(!0),o("form",{onSubmit:p},o("div",{class:"form-group"},R.cloneNode(!0),o("input",{id:"contact-name-input",type:"text",placeholder:"John Doe",value:e.register("name").value,onInput:e.register("name").onInput}),()=>e.errors.name.value&&o("span",{class:"error"},e.errors.name.value)),o("div",{class:"form-group"},F.cloneNode(!0),o("input",{id:"contact-email-input",type:"email",placeholder:"example@gmail.com",value:e.register("email").value,onInput:e.register("email").onInput}),()=>e.errors.email.value&&o("span",{class:"error"},e.errors.email.value)),o("div",{class:"form-group"},j.cloneNode(!0),o("textarea",{id:"contact-message-input",placeholder:"Write something...",value:e.register("message").value,onInput:e.register("message").onInput}),()=>e.errors.message.value&&o("span",{class:"error"},e.errors.message.value)),o("button",{type:"submit",class:()=>`btn primary ${e.isSubmitting.value?"submitting":""}`,disabled:()=>e.isSubmitting.value},()=>e.isSubmitting.value?"Sending\u2026":"Send Now")))}I("contact",N);export{N as a};
