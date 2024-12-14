var Ql=n=>{throw TypeError(n)};var So=(n,t,e)=>t.has(n)||Ql("Cannot "+e);var Nt=(n,t,e)=>(So(n,t,"read from private field"),e?e.call(n):t.get(n)),Kn=(n,t,e)=>t.has(n)?Ql("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(n):t.set(n,e),Pe=(n,t,e,i)=>(So(n,t,"write to private field"),i?i.call(n,e):t.set(n,e),e),de=(n,t,e)=>(So(n,t,"access private method"),e);var Eo=(n,t,e,i)=>({set _(r){Pe(n,t,r,e)},get _(){return Nt(n,t,i)}});(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))i(r);new MutationObserver(r=>{for(const s of r)if(s.type==="childList")for(const o of s.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&i(o)}).observe(document,{childList:!0,subtree:!0});function e(r){const s={};return r.integrity&&(s.integrity=r.integrity),r.referrerPolicy&&(s.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?s.credentials="include":r.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function i(r){if(r.ep)return;r.ep=!0;const s=e(r);fetch(r.href,s)}})();/**
* @vue/shared v3.5.13
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**//*! #__NO_SIDE_EFFECTS__ */function ml(n){const t=Object.create(null);for(const e of n.split(","))t[e]=1;return e=>e in t}const ue={},sr=[],bn=()=>{},yf=()=>!1,so=n=>n.charCodeAt(0)===111&&n.charCodeAt(1)===110&&(n.charCodeAt(2)>122||n.charCodeAt(2)<97),_l=n=>n.startsWith("onUpdate:"),Ce=Object.assign,gl=(n,t)=>{const e=n.indexOf(t);e>-1&&n.splice(e,1)},Tf=Object.prototype.hasOwnProperty,re=(n,t)=>Tf.call(n,t),Xt=Array.isArray,Nr=n=>oo(n)==="[object Map]",bf=n=>oo(n)==="[object Set]",Wt=n=>typeof n=="function",we=n=>typeof n=="string",Sr=n=>typeof n=="symbol",Se=n=>n!==null&&typeof n=="object",Iu=n=>(Se(n)||Wt(n))&&Wt(n.then)&&Wt(n.catch),Af=Object.prototype.toString,oo=n=>Af.call(n),wf=n=>oo(n).slice(8,-1),Rf=n=>oo(n)==="[object Object]",vl=n=>we(n)&&n!=="NaN"&&n[0]!=="-"&&""+parseInt(n,10)===n,Fr=ml(",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"),ao=n=>{const t=Object.create(null);return e=>t[e]||(t[e]=n(e))},Cf=/-(\w)/g,ln=ao(n=>n.replace(Cf,(t,e)=>e?e.toUpperCase():"")),Pf=/\B([A-Z])/g,Fi=ao(n=>n.replace(Pf,"-$1").toLowerCase()),lo=ao(n=>n.charAt(0).toUpperCase()+n.slice(1)),yo=ao(n=>n?`on${lo(n)}`:""),Di=(n,t)=>!Object.is(n,t),To=(n,...t)=>{for(let e=0;e<n.length;e++)n[e](...t)},Uu=(n,t,e,i=!1)=>{Object.defineProperty(n,t,{configurable:!0,enumerable:!1,writable:i,value:e})},Df=n=>{const t=parseFloat(n);return isNaN(t)?n:t};let tc;const co=()=>tc||(tc=typeof globalThis<"u"?globalThis:typeof self<"u"?self:typeof window<"u"?window:typeof global<"u"?global:{});function xl(n){if(Xt(n)){const t={};for(let e=0;e<n.length;e++){const i=n[e],r=we(i)?Nf(i):xl(i);if(r)for(const s in r)t[s]=r[s]}return t}else if(we(n)||Se(n))return n}const Lf=/;(?![^(]*\))/g,If=/:([^]+)/,Uf=/\/\*[^]*?\*\//g;function Nf(n){const t={};return n.replace(Uf,"").split(Lf).forEach(e=>{if(e){const i=e.split(If);i.length>1&&(t[i[0].trim()]=i[1].trim())}}),t}function Ml(n){let t="";if(we(n))t=n;else if(Xt(n))for(let e=0;e<n.length;e++){const i=Ml(n[e]);i&&(t+=i+" ")}else if(Se(n))for(const e in n)n[e]&&(t+=e+" ");return t.trim()}const Ff="itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly",Of=ml(Ff);function Nu(n){return!!n||n===""}/**
* @vue/reactivity v3.5.13
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/let $e;class Bf{constructor(t=!1){this.detached=t,this._active=!0,this.effects=[],this.cleanups=[],this._isPaused=!1,this.parent=$e,!t&&$e&&(this.index=($e.scopes||($e.scopes=[])).push(this)-1)}get active(){return this._active}pause(){if(this._active){this._isPaused=!0;let t,e;if(this.scopes)for(t=0,e=this.scopes.length;t<e;t++)this.scopes[t].pause();for(t=0,e=this.effects.length;t<e;t++)this.effects[t].pause()}}resume(){if(this._active&&this._isPaused){this._isPaused=!1;let t,e;if(this.scopes)for(t=0,e=this.scopes.length;t<e;t++)this.scopes[t].resume();for(t=0,e=this.effects.length;t<e;t++)this.effects[t].resume()}}run(t){if(this._active){const e=$e;try{return $e=this,t()}finally{$e=e}}}on(){$e=this}off(){$e=this.parent}stop(t){if(this._active){this._active=!1;let e,i;for(e=0,i=this.effects.length;e<i;e++)this.effects[e].stop();for(this.effects.length=0,e=0,i=this.cleanups.length;e<i;e++)this.cleanups[e]();if(this.cleanups.length=0,this.scopes){for(e=0,i=this.scopes.length;e<i;e++)this.scopes[e].stop(!0);this.scopes.length=0}if(!this.detached&&this.parent&&!t){const r=this.parent.scopes.pop();r&&r!==this&&(this.parent.scopes[this.index]=r,r.index=this.index)}this.parent=void 0}}}function zf(){return $e}let ce;const bo=new WeakSet;class Fu{constructor(t){this.fn=t,this.deps=void 0,this.depsTail=void 0,this.flags=5,this.next=void 0,this.cleanup=void 0,this.scheduler=void 0,$e&&$e.active&&$e.effects.push(this)}pause(){this.flags|=64}resume(){this.flags&64&&(this.flags&=-65,bo.has(this)&&(bo.delete(this),this.trigger()))}notify(){this.flags&2&&!(this.flags&32)||this.flags&8||Bu(this)}run(){if(!(this.flags&1))return this.fn();this.flags|=2,ec(this),zu(this);const t=ce,e=vn;ce=this,vn=!0;try{return this.fn()}finally{Hu(this),ce=t,vn=e,this.flags&=-3}}stop(){if(this.flags&1){for(let t=this.deps;t;t=t.nextDep)yl(t);this.deps=this.depsTail=void 0,ec(this),this.onStop&&this.onStop(),this.flags&=-2}}trigger(){this.flags&64?bo.add(this):this.scheduler?this.scheduler():this.runIfDirty()}runIfDirty(){fa(this)&&this.run()}get dirty(){return fa(this)}}let Ou=0,Or,Br;function Bu(n,t=!1){if(n.flags|=8,t){n.next=Br,Br=n;return}n.next=Or,Or=n}function Sl(){Ou++}function El(){if(--Ou>0)return;if(Br){let t=Br;for(Br=void 0;t;){const e=t.next;t.next=void 0,t.flags&=-9,t=e}}let n;for(;Or;){let t=Or;for(Or=void 0;t;){const e=t.next;if(t.next=void 0,t.flags&=-9,t.flags&1)try{t.trigger()}catch(i){n||(n=i)}t=e}}if(n)throw n}function zu(n){for(let t=n.deps;t;t=t.nextDep)t.version=-1,t.prevActiveLink=t.dep.activeLink,t.dep.activeLink=t}function Hu(n){let t,e=n.depsTail,i=e;for(;i;){const r=i.prevDep;i.version===-1?(i===e&&(e=r),yl(i),Hf(i)):t=i,i.dep.activeLink=i.prevActiveLink,i.prevActiveLink=void 0,i=r}n.deps=t,n.depsTail=e}function fa(n){for(let t=n.deps;t;t=t.nextDep)if(t.dep.version!==t.version||t.dep.computed&&(Vu(t.dep.computed)||t.dep.version!==t.version))return!0;return!!n._dirty}function Vu(n){if(n.flags&4&&!(n.flags&16)||(n.flags&=-17,n.globalVersion===qr))return;n.globalVersion=qr;const t=n.dep;if(n.flags|=2,t.version>0&&!n.isSSR&&n.deps&&!fa(n)){n.flags&=-3;return}const e=ce,i=vn;ce=n,vn=!0;try{zu(n);const r=n.fn(n._value);(t.version===0||Di(r,n._value))&&(n._value=r,t.version++)}catch(r){throw t.version++,r}finally{ce=e,vn=i,Hu(n),n.flags&=-3}}function yl(n,t=!1){const{dep:e,prevSub:i,nextSub:r}=n;if(i&&(i.nextSub=r,n.prevSub=void 0),r&&(r.prevSub=i,n.nextSub=void 0),e.subs===n&&(e.subs=i,!i&&e.computed)){e.computed.flags&=-5;for(let s=e.computed.deps;s;s=s.nextDep)yl(s,!0)}!t&&!--e.sc&&e.map&&e.map.delete(e.key)}function Hf(n){const{prevDep:t,nextDep:e}=n;t&&(t.nextDep=e,n.prevDep=void 0),e&&(e.prevDep=t,n.nextDep=void 0)}let vn=!0;const Gu=[];function di(){Gu.push(vn),vn=!1}function pi(){const n=Gu.pop();vn=n===void 0?!0:n}function ec(n){const{cleanup:t}=n;if(n.cleanup=void 0,t){const e=ce;ce=void 0;try{t()}finally{ce=e}}}let qr=0;class Vf{constructor(t,e){this.sub=t,this.dep=e,this.version=e.version,this.nextDep=this.prevDep=this.nextSub=this.prevSub=this.prevActiveLink=void 0}}class ku{constructor(t){this.computed=t,this.version=0,this.activeLink=void 0,this.subs=void 0,this.map=void 0,this.key=void 0,this.sc=0}track(t){if(!ce||!vn||ce===this.computed)return;let e=this.activeLink;if(e===void 0||e.sub!==ce)e=this.activeLink=new Vf(ce,this),ce.deps?(e.prevDep=ce.depsTail,ce.depsTail.nextDep=e,ce.depsTail=e):ce.deps=ce.depsTail=e,Wu(e);else if(e.version===-1&&(e.version=this.version,e.nextDep)){const i=e.nextDep;i.prevDep=e.prevDep,e.prevDep&&(e.prevDep.nextDep=i),e.prevDep=ce.depsTail,e.nextDep=void 0,ce.depsTail.nextDep=e,ce.depsTail=e,ce.deps===e&&(ce.deps=i)}return e}trigger(t){this.version++,qr++,this.notify(t)}notify(t){Sl();try{for(let e=this.subs;e;e=e.prevSub)e.sub.notify()&&e.sub.dep.notify()}finally{El()}}}function Wu(n){if(n.dep.sc++,n.sub.flags&4){const t=n.dep.computed;if(t&&!n.dep.subs){t.flags|=20;for(let i=t.deps;i;i=i.nextDep)Wu(i)}const e=n.dep.subs;e!==n&&(n.prevSub=e,e&&(e.nextSub=n)),n.dep.subs=n}}const da=new WeakMap,Li=Symbol(""),pa=Symbol(""),Yr=Symbol("");function Ie(n,t,e){if(vn&&ce){let i=da.get(n);i||da.set(n,i=new Map);let r=i.get(e);r||(i.set(e,r=new ku),r.map=i,r.key=e),r.track()}}function zn(n,t,e,i,r,s){const o=da.get(n);if(!o){qr++;return}const a=l=>{l&&l.trigger()};if(Sl(),t==="clear")o.forEach(a);else{const l=Xt(n),c=l&&vl(e);if(l&&e==="length"){const u=Number(i);o.forEach((h,d)=>{(d==="length"||d===Yr||!Sr(d)&&d>=u)&&a(h)})}else switch((e!==void 0||o.has(void 0))&&a(o.get(e)),c&&a(o.get(Yr)),t){case"add":l?c&&a(o.get("length")):(a(o.get(Li)),Nr(n)&&a(o.get(pa)));break;case"delete":l||(a(o.get(Li)),Nr(n)&&a(o.get(pa)));break;case"set":Nr(n)&&a(o.get(Li));break}}El()}function zi(n){const t=ae(n);return t===n?t:(Ie(t,"iterate",Yr),An(n)?t:t.map(Ze))}function Tl(n){return Ie(n=ae(n),"iterate",Yr),n}const Gf={__proto__:null,[Symbol.iterator](){return Ao(this,Symbol.iterator,Ze)},concat(...n){return zi(this).concat(...n.map(t=>Xt(t)?zi(t):t))},entries(){return Ao(this,"entries",n=>(n[1]=Ze(n[1]),n))},every(n,t){return Pn(this,"every",n,t,void 0,arguments)},filter(n,t){return Pn(this,"filter",n,t,e=>e.map(Ze),arguments)},find(n,t){return Pn(this,"find",n,t,Ze,arguments)},findIndex(n,t){return Pn(this,"findIndex",n,t,void 0,arguments)},findLast(n,t){return Pn(this,"findLast",n,t,Ze,arguments)},findLastIndex(n,t){return Pn(this,"findLastIndex",n,t,void 0,arguments)},forEach(n,t){return Pn(this,"forEach",n,t,void 0,arguments)},includes(...n){return wo(this,"includes",n)},indexOf(...n){return wo(this,"indexOf",n)},join(n){return zi(this).join(n)},lastIndexOf(...n){return wo(this,"lastIndexOf",n)},map(n,t){return Pn(this,"map",n,t,void 0,arguments)},pop(){return Ar(this,"pop")},push(...n){return Ar(this,"push",n)},reduce(n,...t){return nc(this,"reduce",n,t)},reduceRight(n,...t){return nc(this,"reduceRight",n,t)},shift(){return Ar(this,"shift")},some(n,t){return Pn(this,"some",n,t,void 0,arguments)},splice(...n){return Ar(this,"splice",n)},toReversed(){return zi(this).toReversed()},toSorted(n){return zi(this).toSorted(n)},toSpliced(...n){return zi(this).toSpliced(...n)},unshift(...n){return Ar(this,"unshift",n)},values(){return Ao(this,"values",Ze)}};function Ao(n,t,e){const i=Tl(n),r=i[t]();return i!==n&&!An(n)&&(r._next=r.next,r.next=()=>{const s=r._next();return s.value&&(s.value=e(s.value)),s}),r}const kf=Array.prototype;function Pn(n,t,e,i,r,s){const o=Tl(n),a=o!==n&&!An(n),l=o[t];if(l!==kf[t]){const h=l.apply(n,s);return a?Ze(h):h}let c=e;o!==n&&(a?c=function(h,d){return e.call(this,Ze(h),d,n)}:e.length>2&&(c=function(h,d){return e.call(this,h,d,n)}));const u=l.call(o,c,i);return a&&r?r(u):u}function nc(n,t,e,i){const r=Tl(n);let s=e;return r!==n&&(An(n)?e.length>3&&(s=function(o,a,l){return e.call(this,o,a,l,n)}):s=function(o,a,l){return e.call(this,o,Ze(a),l,n)}),r[t](s,...i)}function wo(n,t,e){const i=ae(n);Ie(i,"iterate",Yr);const r=i[t](...e);return(r===-1||r===!1)&&Rl(e[0])?(e[0]=ae(e[0]),i[t](...e)):r}function Ar(n,t,e=[]){di(),Sl();const i=ae(n)[t].apply(n,e);return El(),pi(),i}const Wf=ml("__proto__,__v_isRef,__isVue"),Xu=new Set(Object.getOwnPropertyNames(Symbol).filter(n=>n!=="arguments"&&n!=="caller").map(n=>Symbol[n]).filter(Sr));function Xf(n){Sr(n)||(n=String(n));const t=ae(this);return Ie(t,"has",n),t.hasOwnProperty(n)}class qu{constructor(t=!1,e=!1){this._isReadonly=t,this._isShallow=e}get(t,e,i){if(e==="__v_skip")return t.__v_skip;const r=this._isReadonly,s=this._isShallow;if(e==="__v_isReactive")return!r;if(e==="__v_isReadonly")return r;if(e==="__v_isShallow")return s;if(e==="__v_raw")return i===(r?s?ed:$u:s?Ku:ju).get(t)||Object.getPrototypeOf(t)===Object.getPrototypeOf(i)?t:void 0;const o=Xt(t);if(!r){let l;if(o&&(l=Gf[e]))return l;if(e==="hasOwnProperty")return Xf}const a=Reflect.get(t,e,He(t)?t:i);return(Sr(e)?Xu.has(e):Wf(e))||(r||Ie(t,"get",e),s)?a:He(a)?o&&vl(e)?a:a.value:Se(a)?r?Zu(a):Al(a):a}}class Yu extends qu{constructor(t=!1){super(!1,t)}set(t,e,i,r){let s=t[e];if(!this._isShallow){const l=fr(s);if(!An(i)&&!fr(i)&&(s=ae(s),i=ae(i)),!Xt(t)&&He(s)&&!He(i))return l?!1:(s.value=i,!0)}const o=Xt(t)&&vl(e)?Number(e)<t.length:re(t,e),a=Reflect.set(t,e,i,He(t)?t:r);return t===ae(r)&&(o?Di(i,s)&&zn(t,"set",e,i):zn(t,"add",e,i)),a}deleteProperty(t,e){const i=re(t,e);t[e];const r=Reflect.deleteProperty(t,e);return r&&i&&zn(t,"delete",e,void 0),r}has(t,e){const i=Reflect.has(t,e);return(!Sr(e)||!Xu.has(e))&&Ie(t,"has",e),i}ownKeys(t){return Ie(t,"iterate",Xt(t)?"length":Li),Reflect.ownKeys(t)}}class qf extends qu{constructor(t=!1){super(!0,t)}set(t,e){return!0}deleteProperty(t,e){return!0}}const Yf=new Yu,jf=new qf,Kf=new Yu(!0);const ma=n=>n,cs=n=>Reflect.getPrototypeOf(n);function $f(n,t,e){return function(...i){const r=this.__v_raw,s=ae(r),o=Nr(s),a=n==="entries"||n===Symbol.iterator&&o,l=n==="keys"&&o,c=r[n](...i),u=e?ma:t?_a:Ze;return!t&&Ie(s,"iterate",l?pa:Li),{next(){const{value:h,done:d}=c.next();return d?{value:h,done:d}:{value:a?[u(h[0]),u(h[1])]:u(h),done:d}},[Symbol.iterator](){return this}}}}function us(n){return function(...t){return n==="delete"?!1:n==="clear"?void 0:this}}function Zf(n,t){const e={get(r){const s=this.__v_raw,o=ae(s),a=ae(r);n||(Di(r,a)&&Ie(o,"get",r),Ie(o,"get",a));const{has:l}=cs(o),c=t?ma:n?_a:Ze;if(l.call(o,r))return c(s.get(r));if(l.call(o,a))return c(s.get(a));s!==o&&s.get(r)},get size(){const r=this.__v_raw;return!n&&Ie(ae(r),"iterate",Li),Reflect.get(r,"size",r)},has(r){const s=this.__v_raw,o=ae(s),a=ae(r);return n||(Di(r,a)&&Ie(o,"has",r),Ie(o,"has",a)),r===a?s.has(r):s.has(r)||s.has(a)},forEach(r,s){const o=this,a=o.__v_raw,l=ae(a),c=t?ma:n?_a:Ze;return!n&&Ie(l,"iterate",Li),a.forEach((u,h)=>r.call(s,c(u),c(h),o))}};return Ce(e,n?{add:us("add"),set:us("set"),delete:us("delete"),clear:us("clear")}:{add(r){!t&&!An(r)&&!fr(r)&&(r=ae(r));const s=ae(this);return cs(s).has.call(s,r)||(s.add(r),zn(s,"add",r,r)),this},set(r,s){!t&&!An(s)&&!fr(s)&&(s=ae(s));const o=ae(this),{has:a,get:l}=cs(o);let c=a.call(o,r);c||(r=ae(r),c=a.call(o,r));const u=l.call(o,r);return o.set(r,s),c?Di(s,u)&&zn(o,"set",r,s):zn(o,"add",r,s),this},delete(r){const s=ae(this),{has:o,get:a}=cs(s);let l=o.call(s,r);l||(r=ae(r),l=o.call(s,r)),a&&a.call(s,r);const c=s.delete(r);return l&&zn(s,"delete",r,void 0),c},clear(){const r=ae(this),s=r.size!==0,o=r.clear();return s&&zn(r,"clear",void 0,void 0),o}}),["keys","values","entries",Symbol.iterator].forEach(r=>{e[r]=$f(r,n,t)}),e}function bl(n,t){const e=Zf(n,t);return(i,r,s)=>r==="__v_isReactive"?!n:r==="__v_isReadonly"?n:r==="__v_raw"?i:Reflect.get(re(e,r)&&r in i?e:i,r,s)}const Jf={get:bl(!1,!1)},Qf={get:bl(!1,!0)},td={get:bl(!0,!1)};const ju=new WeakMap,Ku=new WeakMap,$u=new WeakMap,ed=new WeakMap;function nd(n){switch(n){case"Object":case"Array":return 1;case"Map":case"Set":case"WeakMap":case"WeakSet":return 2;default:return 0}}function id(n){return n.__v_skip||!Object.isExtensible(n)?0:nd(wf(n))}function Al(n){return fr(n)?n:wl(n,!1,Yf,Jf,ju)}function rd(n){return wl(n,!1,Kf,Qf,Ku)}function Zu(n){return wl(n,!0,jf,td,$u)}function wl(n,t,e,i,r){if(!Se(n)||n.__v_raw&&!(t&&n.__v_isReactive))return n;const s=r.get(n);if(s)return s;const o=id(n);if(o===0)return n;const a=new Proxy(n,o===2?i:e);return r.set(n,a),a}function zr(n){return fr(n)?zr(n.__v_raw):!!(n&&n.__v_isReactive)}function fr(n){return!!(n&&n.__v_isReadonly)}function An(n){return!!(n&&n.__v_isShallow)}function Rl(n){return n?!!n.__v_raw:!1}function ae(n){const t=n&&n.__v_raw;return t?ae(t):n}function sd(n){return!re(n,"__v_skip")&&Object.isExtensible(n)&&Uu(n,"__v_skip",!0),n}const Ze=n=>Se(n)?Al(n):n,_a=n=>Se(n)?Zu(n):n;function He(n){return n?n.__v_isRef===!0:!1}function od(n){return He(n)?n.value:n}const ad={get:(n,t,e)=>t==="__v_raw"?n:od(Reflect.get(n,t,e)),set:(n,t,e,i)=>{const r=n[t];return He(r)&&!He(e)?(r.value=e,!0):Reflect.set(n,t,e,i)}};function Ju(n){return zr(n)?n:new Proxy(n,ad)}class ld{constructor(t,e,i){this.fn=t,this.setter=e,this._value=void 0,this.dep=new ku(this),this.__v_isRef=!0,this.deps=void 0,this.depsTail=void 0,this.flags=16,this.globalVersion=qr-1,this.next=void 0,this.effect=this,this.__v_isReadonly=!e,this.isSSR=i}notify(){if(this.flags|=16,!(this.flags&8)&&ce!==this)return Bu(this,!0),!0}get value(){const t=this.dep.track();return Vu(this),t&&(t.version=this.dep.version),this._value}set value(t){this.setter&&this.setter(t)}}function cd(n,t,e=!1){let i,r;return Wt(n)?i=n:(i=n.get,r=n.set),new ld(i,r,e)}const hs={},js=new WeakMap;let bi;function ud(n,t=!1,e=bi){if(e){let i=js.get(e);i||js.set(e,i=[]),i.push(n)}}function hd(n,t,e=ue){const{immediate:i,deep:r,once:s,scheduler:o,augmentJob:a,call:l}=e,c=b=>r?b:An(b)||r===!1||r===0?si(b,1):si(b);let u,h,d,p,x=!1,S=!1;if(He(n)?(h=()=>n.value,x=An(n)):zr(n)?(h=()=>c(n),x=!0):Xt(n)?(S=!0,x=n.some(b=>zr(b)||An(b)),h=()=>n.map(b=>{if(He(b))return b.value;if(zr(b))return c(b);if(Wt(b))return l?l(b,2):b()})):Wt(n)?t?h=l?()=>l(n,2):n:h=()=>{if(d){di();try{d()}finally{pi()}}const b=bi;bi=u;try{return l?l(n,3,[p]):n(p)}finally{bi=b}}:h=bn,t&&r){const b=h,O=r===!0?1/0:r;h=()=>si(b(),O)}const g=zf(),f=()=>{u.stop(),g&&g.active&&gl(g.effects,u)};if(s&&t){const b=t;t=(...O)=>{b(...O),f()}}let P=S?new Array(n.length).fill(hs):hs;const C=b=>{if(!(!(u.flags&1)||!u.dirty&&!b))if(t){const O=u.run();if(r||x||(S?O.some((F,L)=>Di(F,P[L])):Di(O,P))){d&&d();const F=bi;bi=u;try{const L=[O,P===hs?void 0:S&&P[0]===hs?[]:P,p];l?l(t,3,L):t(...L),P=O}finally{bi=F}}}else u.run()};return a&&a(C),u=new Fu(h),u.scheduler=o?()=>o(C,!1):C,p=b=>ud(b,!1,u),d=u.onStop=()=>{const b=js.get(u);if(b){if(l)l(b,4);else for(const O of b)O();js.delete(u)}},t?i?C(!0):P=u.run():o?o(C.bind(null,!0),!0):u.run(),f.pause=u.pause.bind(u),f.resume=u.resume.bind(u),f.stop=f,f}function si(n,t=1/0,e){if(t<=0||!Se(n)||n.__v_skip||(e=e||new Set,e.has(n)))return n;if(e.add(n),t--,He(n))si(n.value,t,e);else if(Xt(n))for(let i=0;i<n.length;i++)si(n[i],t,e);else if(bf(n)||Nr(n))n.forEach(i=>{si(i,t,e)});else if(Rf(n)){for(const i in n)si(n[i],t,e);for(const i of Object.getOwnPropertySymbols(n))Object.prototype.propertyIsEnumerable.call(n,i)&&si(n[i],t,e)}return n}/**
* @vue/runtime-core v3.5.13
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/function es(n,t,e,i){try{return i?n(...i):n()}catch(r){uo(r,t,e)}}function Rn(n,t,e,i){if(Wt(n)){const r=es(n,t,e,i);return r&&Iu(r)&&r.catch(s=>{uo(s,t,e)}),r}if(Xt(n)){const r=[];for(let s=0;s<n.length;s++)r.push(Rn(n[s],t,e,i));return r}}function uo(n,t,e,i=!0){const r=t?t.vnode:null,{errorHandler:s,throwUnhandledErrorInProduction:o}=t&&t.appContext.config||ue;if(t){let a=t.parent;const l=t.proxy,c=`https://vuejs.org/error-reference/#runtime-${e}`;for(;a;){const u=a.ec;if(u){for(let h=0;h<u.length;h++)if(u[h](n,l,c)===!1)return}a=a.parent}if(s){di(),es(s,null,10,[n,l,c]),pi();return}}fd(n,e,r,i,o)}function fd(n,t,e,i=!0,r=!1){if(r)throw n;console.error(n)}const ze=[];let Sn=-1;const or=[];let ni=null,tr=0;const Qu=Promise.resolve();let Ks=null;function dd(n){const t=Ks||Qu;return n?t.then(this?n.bind(this):n):t}function pd(n){let t=Sn+1,e=ze.length;for(;t<e;){const i=t+e>>>1,r=ze[i],s=jr(r);s<n||s===n&&r.flags&2?t=i+1:e=i}return t}function Cl(n){if(!(n.flags&1)){const t=jr(n),e=ze[ze.length-1];!e||!(n.flags&2)&&t>=jr(e)?ze.push(n):ze.splice(pd(t),0,n),n.flags|=1,th()}}function th(){Ks||(Ks=Qu.then(nh))}function md(n){Xt(n)?or.push(...n):ni&&n.id===-1?ni.splice(tr+1,0,n):n.flags&1||(or.push(n),n.flags|=1),th()}function ic(n,t,e=Sn+1){for(;e<ze.length;e++){const i=ze[e];if(i&&i.flags&2){if(n&&i.id!==n.uid)continue;ze.splice(e,1),e--,i.flags&4&&(i.flags&=-2),i(),i.flags&4||(i.flags&=-2)}}}function eh(n){if(or.length){const t=[...new Set(or)].sort((e,i)=>jr(e)-jr(i));if(or.length=0,ni){ni.push(...t);return}for(ni=t,tr=0;tr<ni.length;tr++){const e=ni[tr];e.flags&4&&(e.flags&=-2),e.flags&8||e(),e.flags&=-2}ni=null,tr=0}}const jr=n=>n.id==null?n.flags&2?-1:1/0:n.id;function nh(n){try{for(Sn=0;Sn<ze.length;Sn++){const t=ze[Sn];t&&!(t.flags&8)&&(t.flags&4&&(t.flags&=-2),es(t,t.i,t.i?15:14),t.flags&4||(t.flags&=-2))}}finally{for(;Sn<ze.length;Sn++){const t=ze[Sn];t&&(t.flags&=-2)}Sn=-1,ze.length=0,eh(),Ks=null,(ze.length||or.length)&&nh()}}let _n=null,ih=null;function $s(n){const t=_n;return _n=n,ih=n&&n.type.__scopeId||null,t}function _d(n,t=_n,e){if(!t||n._n)return n;const i=(...r)=>{i._d&&fc(-1);const s=$s(t);let o;try{o=n(...r)}finally{$s(s),i._d&&fc(1)}return o};return i._n=!0,i._c=!0,i._d=!0,i}function gi(n,t,e,i){const r=n.dirs,s=t&&t.dirs;for(let o=0;o<r.length;o++){const a=r[o];s&&(a.oldValue=s[o].value);let l=a.dir[i];l&&(di(),Rn(l,e,8,[n.el,a,n,t]),pi())}}const gd=Symbol("_vte"),vd=n=>n.__isTeleport;function Pl(n,t){n.shapeFlag&6&&n.component?(n.transition=t,Pl(n.component.subTree,t)):n.shapeFlag&128?(n.ssContent.transition=t.clone(n.ssContent),n.ssFallback.transition=t.clone(n.ssFallback)):n.transition=t}function rh(n){n.ids=[n.ids[0]+n.ids[2]+++"-",0,0]}function Zs(n,t,e,i,r=!1){if(Xt(n)){n.forEach((x,S)=>Zs(x,t&&(Xt(t)?t[S]:t),e,i,r));return}if(Hr(i)&&!r){i.shapeFlag&512&&i.type.__asyncResolved&&i.component.subTree.component&&Zs(n,t,e,i.component.subTree);return}const s=i.shapeFlag&4?Ul(i.component):i.el,o=r?null:s,{i:a,r:l}=n,c=t&&t.r,u=a.refs===ue?a.refs={}:a.refs,h=a.setupState,d=ae(h),p=h===ue?()=>!1:x=>re(d,x);if(c!=null&&c!==l&&(we(c)?(u[c]=null,p(c)&&(h[c]=null)):He(c)&&(c.value=null)),Wt(l))es(l,a,12,[o,u]);else{const x=we(l),S=He(l);if(x||S){const g=()=>{if(n.f){const f=x?p(l)?h[l]:u[l]:l.value;r?Xt(f)&&gl(f,s):Xt(f)?f.includes(s)||f.push(s):x?(u[l]=[s],p(l)&&(h[l]=u[l])):(l.value=[s],n.k&&(u[n.k]=l.value))}else x?(u[l]=o,p(l)&&(h[l]=o)):S&&(l.value=o,n.k&&(u[n.k]=o))};o?(g.id=-1,Ke(g,e)):g()}}}co().requestIdleCallback;co().cancelIdleCallback;const Hr=n=>!!n.type.__asyncLoader,sh=n=>n.type.__isKeepAlive;function xd(n,t){oh(n,"a",t)}function Md(n,t){oh(n,"da",t)}function oh(n,t,e=Ue){const i=n.__wdc||(n.__wdc=()=>{let r=e;for(;r;){if(r.isDeactivated)return;r=r.parent}return n()});if(ho(t,i,e),e){let r=e.parent;for(;r&&r.parent;)sh(r.parent.vnode)&&Sd(i,t,e,r),r=r.parent}}function Sd(n,t,e,i){const r=ho(t,n,i,!0);ah(()=>{gl(i[t],r)},e)}function ho(n,t,e=Ue,i=!1){if(e){const r=e[n]||(e[n]=[]),s=t.__weh||(t.__weh=(...o)=>{di();const a=ns(e),l=Rn(t,e,n,o);return a(),pi(),l});return i?r.unshift(s):r.push(s),s}}const jn=n=>(t,e=Ue)=>{(!Zr||n==="sp")&&ho(n,(...i)=>t(...i),e)},Ed=jn("bm"),yd=jn("m"),Td=jn("bu"),bd=jn("u"),Ad=jn("bum"),ah=jn("um"),wd=jn("sp"),Rd=jn("rtg"),Cd=jn("rtc");function Pd(n,t=Ue){ho("ec",n,t)}const Dd="components";function Ld(n,t){return Ud(Dd,n,!0,t)||n}const Id=Symbol.for("v-ndc");function Ud(n,t,e=!0,i=!1){const r=_n||Ue;if(r){const s=r.type;{const a=yp(s,!1);if(a&&(a===t||a===ln(t)||a===lo(ln(t))))return s}const o=rc(r[n]||s[n],t)||rc(r.appContext[n],t);return!o&&i?s:o}}function rc(n,t){return n&&(n[t]||n[ln(t)]||n[lo(ln(t))])}const ga=n=>n?Ch(n)?Ul(n):ga(n.parent):null,Vr=Ce(Object.create(null),{$:n=>n,$el:n=>n.vnode.el,$data:n=>n.data,$props:n=>n.props,$attrs:n=>n.attrs,$slots:n=>n.slots,$refs:n=>n.refs,$parent:n=>ga(n.parent),$root:n=>ga(n.root),$host:n=>n.ce,$emit:n=>n.emit,$options:n=>Dl(n),$forceUpdate:n=>n.f||(n.f=()=>{Cl(n.update)}),$nextTick:n=>n.n||(n.n=dd.bind(n.proxy)),$watch:n=>np.bind(n)}),Ro=(n,t)=>n!==ue&&!n.__isScriptSetup&&re(n,t),Nd={get({_:n},t){if(t==="__v_skip")return!0;const{ctx:e,setupState:i,data:r,props:s,accessCache:o,type:a,appContext:l}=n;let c;if(t[0]!=="$"){const p=o[t];if(p!==void 0)switch(p){case 1:return i[t];case 2:return r[t];case 4:return e[t];case 3:return s[t]}else{if(Ro(i,t))return o[t]=1,i[t];if(r!==ue&&re(r,t))return o[t]=2,r[t];if((c=n.propsOptions[0])&&re(c,t))return o[t]=3,s[t];if(e!==ue&&re(e,t))return o[t]=4,e[t];va&&(o[t]=0)}}const u=Vr[t];let h,d;if(u)return t==="$attrs"&&Ie(n.attrs,"get",""),u(n);if((h=a.__cssModules)&&(h=h[t]))return h;if(e!==ue&&re(e,t))return o[t]=4,e[t];if(d=l.config.globalProperties,re(d,t))return d[t]},set({_:n},t,e){const{data:i,setupState:r,ctx:s}=n;return Ro(r,t)?(r[t]=e,!0):i!==ue&&re(i,t)?(i[t]=e,!0):re(n.props,t)||t[0]==="$"&&t.slice(1)in n?!1:(s[t]=e,!0)},has({_:{data:n,setupState:t,accessCache:e,ctx:i,appContext:r,propsOptions:s}},o){let a;return!!e[o]||n!==ue&&re(n,o)||Ro(t,o)||(a=s[0])&&re(a,o)||re(i,o)||re(Vr,o)||re(r.config.globalProperties,o)},defineProperty(n,t,e){return e.get!=null?n._.accessCache[t]=0:re(e,"value")&&this.set(n,t,e.value,null),Reflect.defineProperty(n,t,e)}};function sc(n){return Xt(n)?n.reduce((t,e)=>(t[e]=null,t),{}):n}let va=!0;function Fd(n){const t=Dl(n),e=n.proxy,i=n.ctx;va=!1,t.beforeCreate&&oc(t.beforeCreate,n,"bc");const{data:r,computed:s,methods:o,watch:a,provide:l,inject:c,created:u,beforeMount:h,mounted:d,beforeUpdate:p,updated:x,activated:S,deactivated:g,beforeDestroy:f,beforeUnmount:P,destroyed:C,unmounted:b,render:O,renderTracked:F,renderTriggered:L,errorCaptured:V,serverPrefetch:w,expose:T,inheritAttrs:U,components:rt,directives:Z,filters:ot}=t;if(c&&Od(c,i,null),o)for(const nt in o){const G=o[nt];Wt(G)&&(i[nt]=G.bind(e))}if(r){const nt=r.call(e,e);Se(nt)&&(n.data=Al(nt))}if(va=!0,s)for(const nt in s){const G=s[nt],mt=Wt(G)?G.bind(e,e):Wt(G.get)?G.get.bind(e,e):bn,St=!Wt(G)&&Wt(G.set)?G.set.bind(e):bn,xt=bp({get:mt,set:St});Object.defineProperty(i,nt,{enumerable:!0,configurable:!0,get:()=>xt.value,set:Ut=>xt.value=Ut})}if(a)for(const nt in a)lh(a[nt],i,e,nt);if(l){const nt=Wt(l)?l.call(e):l;Reflect.ownKeys(nt).forEach(G=>{kd(G,nt[G])})}u&&oc(u,n,"c");function et(nt,G){Xt(G)?G.forEach(mt=>nt(mt.bind(e))):G&&nt(G.bind(e))}if(et(Ed,h),et(yd,d),et(Td,p),et(bd,x),et(xd,S),et(Md,g),et(Pd,V),et(Cd,F),et(Rd,L),et(Ad,P),et(ah,b),et(wd,w),Xt(T))if(T.length){const nt=n.exposed||(n.exposed={});T.forEach(G=>{Object.defineProperty(nt,G,{get:()=>e[G],set:mt=>e[G]=mt})})}else n.exposed||(n.exposed={});O&&n.render===bn&&(n.render=O),U!=null&&(n.inheritAttrs=U),rt&&(n.components=rt),Z&&(n.directives=Z),w&&rh(n)}function Od(n,t,e=bn){Xt(n)&&(n=xa(n));for(const i in n){const r=n[i];let s;Se(r)?"default"in r?s=zs(r.from||i,r.default,!0):s=zs(r.from||i):s=zs(r),He(s)?Object.defineProperty(t,i,{enumerable:!0,configurable:!0,get:()=>s.value,set:o=>s.value=o}):t[i]=s}}function oc(n,t,e){Rn(Xt(n)?n.map(i=>i.bind(t.proxy)):n.bind(t.proxy),t,e)}function lh(n,t,e,i){let r=i.includes(".")?Eh(e,i):()=>e[i];if(we(n)){const s=t[n];Wt(s)&&Po(r,s)}else if(Wt(n))Po(r,n.bind(e));else if(Se(n))if(Xt(n))n.forEach(s=>lh(s,t,e,i));else{const s=Wt(n.handler)?n.handler.bind(e):t[n.handler];Wt(s)&&Po(r,s,n)}}function Dl(n){const t=n.type,{mixins:e,extends:i}=t,{mixins:r,optionsCache:s,config:{optionMergeStrategies:o}}=n.appContext,a=s.get(t);let l;return a?l=a:!r.length&&!e&&!i?l=t:(l={},r.length&&r.forEach(c=>Js(l,c,o,!0)),Js(l,t,o)),Se(t)&&s.set(t,l),l}function Js(n,t,e,i=!1){const{mixins:r,extends:s}=t;s&&Js(n,s,e,!0),r&&r.forEach(o=>Js(n,o,e,!0));for(const o in t)if(!(i&&o==="expose")){const a=Bd[o]||e&&e[o];n[o]=a?a(n[o],t[o]):t[o]}return n}const Bd={data:ac,props:lc,emits:lc,methods:Ir,computed:Ir,beforeCreate:Fe,created:Fe,beforeMount:Fe,mounted:Fe,beforeUpdate:Fe,updated:Fe,beforeDestroy:Fe,beforeUnmount:Fe,destroyed:Fe,unmounted:Fe,activated:Fe,deactivated:Fe,errorCaptured:Fe,serverPrefetch:Fe,components:Ir,directives:Ir,watch:Hd,provide:ac,inject:zd};function ac(n,t){return t?n?function(){return Ce(Wt(n)?n.call(this,this):n,Wt(t)?t.call(this,this):t)}:t:n}function zd(n,t){return Ir(xa(n),xa(t))}function xa(n){if(Xt(n)){const t={};for(let e=0;e<n.length;e++)t[n[e]]=n[e];return t}return n}function Fe(n,t){return n?[...new Set([].concat(n,t))]:t}function Ir(n,t){return n?Ce(Object.create(null),n,t):t}function lc(n,t){return n?Xt(n)&&Xt(t)?[...new Set([...n,...t])]:Ce(Object.create(null),sc(n),sc(t??{})):t}function Hd(n,t){if(!n)return t;if(!t)return n;const e=Ce(Object.create(null),n);for(const i in t)e[i]=Fe(n[i],t[i]);return e}function ch(){return{app:null,config:{isNativeTag:yf,performance:!1,globalProperties:{},optionMergeStrategies:{},errorHandler:void 0,warnHandler:void 0,compilerOptions:{}},mixins:[],components:{},directives:{},provides:Object.create(null),optionsCache:new WeakMap,propsCache:new WeakMap,emitsCache:new WeakMap}}let Vd=0;function Gd(n,t){return function(i,r=null){Wt(i)||(i=Ce({},i)),r!=null&&!Se(r)&&(r=null);const s=ch(),o=new WeakSet,a=[];let l=!1;const c=s.app={_uid:Vd++,_component:i,_props:r,_container:null,_context:s,_instance:null,version:Ap,get config(){return s.config},set config(u){},use(u,...h){return o.has(u)||(u&&Wt(u.install)?(o.add(u),u.install(c,...h)):Wt(u)&&(o.add(u),u(c,...h))),c},mixin(u){return s.mixins.includes(u)||s.mixins.push(u),c},component(u,h){return h?(s.components[u]=h,c):s.components[u]},directive(u,h){return h?(s.directives[u]=h,c):s.directives[u]},mount(u,h,d){if(!l){const p=c._ceVNode||ci(i,r);return p.appContext=s,d===!0?d="svg":d===!1&&(d=void 0),h&&t?t(p,u):n(p,u,d),l=!0,c._container=u,u.__vue_app__=c,Ul(p.component)}},onUnmount(u){a.push(u)},unmount(){l&&(Rn(a,c._instance,16),n(null,c._container),delete c._container.__vue_app__)},provide(u,h){return s.provides[u]=h,c},runWithContext(u){const h=ar;ar=c;try{return u()}finally{ar=h}}};return c}}let ar=null;function kd(n,t){if(Ue){let e=Ue.provides;const i=Ue.parent&&Ue.parent.provides;i===e&&(e=Ue.provides=Object.create(i)),e[n]=t}}function zs(n,t,e=!1){const i=Ue||_n;if(i||ar){const r=ar?ar._context.provides:i?i.parent==null?i.vnode.appContext&&i.vnode.appContext.provides:i.parent.provides:void 0;if(r&&n in r)return r[n];if(arguments.length>1)return e&&Wt(t)?t.call(i&&i.proxy):t}}const uh={},hh=()=>Object.create(uh),fh=n=>Object.getPrototypeOf(n)===uh;function Wd(n,t,e,i=!1){const r={},s=hh();n.propsDefaults=Object.create(null),dh(n,t,r,s);for(const o in n.propsOptions[0])o in r||(r[o]=void 0);e?n.props=i?r:rd(r):n.type.props?n.props=r:n.props=s,n.attrs=s}function Xd(n,t,e,i){const{props:r,attrs:s,vnode:{patchFlag:o}}=n,a=ae(r),[l]=n.propsOptions;let c=!1;if((i||o>0)&&!(o&16)){if(o&8){const u=n.vnode.dynamicProps;for(let h=0;h<u.length;h++){let d=u[h];if(fo(n.emitsOptions,d))continue;const p=t[d];if(l)if(re(s,d))p!==s[d]&&(s[d]=p,c=!0);else{const x=ln(d);r[x]=Ma(l,a,x,p,n,!1)}else p!==s[d]&&(s[d]=p,c=!0)}}}else{dh(n,t,r,s)&&(c=!0);let u;for(const h in a)(!t||!re(t,h)&&((u=Fi(h))===h||!re(t,u)))&&(l?e&&(e[h]!==void 0||e[u]!==void 0)&&(r[h]=Ma(l,a,h,void 0,n,!0)):delete r[h]);if(s!==a)for(const h in s)(!t||!re(t,h))&&(delete s[h],c=!0)}c&&zn(n.attrs,"set","")}function dh(n,t,e,i){const[r,s]=n.propsOptions;let o=!1,a;if(t)for(let l in t){if(Fr(l))continue;const c=t[l];let u;r&&re(r,u=ln(l))?!s||!s.includes(u)?e[u]=c:(a||(a={}))[u]=c:fo(n.emitsOptions,l)||(!(l in i)||c!==i[l])&&(i[l]=c,o=!0)}if(s){const l=ae(e),c=a||ue;for(let u=0;u<s.length;u++){const h=s[u];e[h]=Ma(r,l,h,c[h],n,!re(c,h))}}return o}function Ma(n,t,e,i,r,s){const o=n[e];if(o!=null){const a=re(o,"default");if(a&&i===void 0){const l=o.default;if(o.type!==Function&&!o.skipFactory&&Wt(l)){const{propsDefaults:c}=r;if(e in c)i=c[e];else{const u=ns(r);i=c[e]=l.call(null,t),u()}}else i=l;r.ce&&r.ce._setProp(e,i)}o[0]&&(s&&!a?i=!1:o[1]&&(i===""||i===Fi(e))&&(i=!0))}return i}const qd=new WeakMap;function ph(n,t,e=!1){const i=e?qd:t.propsCache,r=i.get(n);if(r)return r;const s=n.props,o={},a=[];let l=!1;if(!Wt(n)){const u=h=>{l=!0;const[d,p]=ph(h,t,!0);Ce(o,d),p&&a.push(...p)};!e&&t.mixins.length&&t.mixins.forEach(u),n.extends&&u(n.extends),n.mixins&&n.mixins.forEach(u)}if(!s&&!l)return Se(n)&&i.set(n,sr),sr;if(Xt(s))for(let u=0;u<s.length;u++){const h=ln(s[u]);cc(h)&&(o[h]=ue)}else if(s)for(const u in s){const h=ln(u);if(cc(h)){const d=s[u],p=o[h]=Xt(d)||Wt(d)?{type:d}:Ce({},d),x=p.type;let S=!1,g=!0;if(Xt(x))for(let f=0;f<x.length;++f){const P=x[f],C=Wt(P)&&P.name;if(C==="Boolean"){S=!0;break}else C==="String"&&(g=!1)}else S=Wt(x)&&x.name==="Boolean";p[0]=S,p[1]=g,(S||re(p,"default"))&&a.push(h)}}const c=[o,a];return Se(n)&&i.set(n,c),c}function cc(n){return n[0]!=="$"&&!Fr(n)}const mh=n=>n[0]==="_"||n==="$stable",Ll=n=>Xt(n)?n.map(En):[En(n)],Yd=(n,t,e)=>{if(t._n)return t;const i=_d((...r)=>Ll(t(...r)),e);return i._c=!1,i},_h=(n,t,e)=>{const i=n._ctx;for(const r in n){if(mh(r))continue;const s=n[r];if(Wt(s))t[r]=Yd(r,s,i);else if(s!=null){const o=Ll(s);t[r]=()=>o}}},gh=(n,t)=>{const e=Ll(t);n.slots.default=()=>e},vh=(n,t,e)=>{for(const i in t)(e||i!=="_")&&(n[i]=t[i])},jd=(n,t,e)=>{const i=n.slots=hh();if(n.vnode.shapeFlag&32){const r=t._;r?(vh(i,t,e),e&&Uu(i,"_",r,!0)):_h(t,i)}else t&&gh(n,t)},Kd=(n,t,e)=>{const{vnode:i,slots:r}=n;let s=!0,o=ue;if(i.shapeFlag&32){const a=t._;a?e&&a===1?s=!1:vh(r,t,e):(s=!t.$stable,_h(t,r)),o=t}else t&&(gh(n,t),o={default:1});if(s)for(const a in r)!mh(a)&&o[a]==null&&delete r[a]},Ke=cp;function $d(n){return Zd(n)}function Zd(n,t){const e=co();e.__VUE__=!0;const{insert:i,remove:r,patchProp:s,createElement:o,createText:a,createComment:l,setText:c,setElementText:u,parentNode:h,nextSibling:d,setScopeId:p=bn,insertStaticContent:x}=n,S=(R,v,$,tt=null,J=null,W=null,ct=void 0,Q=null,M=!!v.dynamicChildren)=>{if(R===v)return;R&&!wr(R,v)&&(tt=gt(R),Ut(R,J,W,!0),R=null),v.patchFlag===-2&&(M=!1,v.dynamicChildren=null);const{type:_,ref:D,shapeFlag:m}=v;switch(_){case po:g(R,v,$,tt);break;case Kr:f(R,v,$,tt);break;case Lo:R==null&&P(v,$,tt,ct);break;case Bn:rt(R,v,$,tt,J,W,ct,Q,M);break;default:m&1?O(R,v,$,tt,J,W,ct,Q,M):m&6?Z(R,v,$,tt,J,W,ct,Q,M):(m&64||m&128)&&_.process(R,v,$,tt,J,W,ct,Q,M,Bt)}D!=null&&J&&Zs(D,R&&R.ref,W,v||R,!v)},g=(R,v,$,tt)=>{if(R==null)i(v.el=a(v.children),$,tt);else{const J=v.el=R.el;v.children!==R.children&&c(J,v.children)}},f=(R,v,$,tt)=>{R==null?i(v.el=l(v.children||""),$,tt):v.el=R.el},P=(R,v,$,tt)=>{[R.el,R.anchor]=x(R.children,v,$,tt,R.el,R.anchor)},C=({el:R,anchor:v},$,tt)=>{let J;for(;R&&R!==v;)J=d(R),i(R,$,tt),R=J;i(v,$,tt)},b=({el:R,anchor:v})=>{let $;for(;R&&R!==v;)$=d(R),r(R),R=$;r(v)},O=(R,v,$,tt,J,W,ct,Q,M)=>{v.type==="svg"?ct="svg":v.type==="math"&&(ct="mathml"),R==null?F(v,$,tt,J,W,ct,Q,M):w(R,v,J,W,ct,Q,M)},F=(R,v,$,tt,J,W,ct,Q)=>{let M,_;const{props:D,shapeFlag:m,transition:y,dirs:A}=R;if(M=R.el=o(R.type,W,D&&D.is,D),m&8?u(M,R.children):m&16&&V(R.children,M,null,tt,J,Co(R,W),ct,Q),A&&gi(R,null,tt,"created"),L(M,R,R.scopeId,ct,tt),D){for(const z in D)z!=="value"&&!Fr(z)&&s(M,z,null,D[z],W,tt);"value"in D&&s(M,"value",null,D.value,W),(_=D.onVnodeBeforeMount)&&Mn(_,tt,R)}A&&gi(R,null,tt,"beforeMount");const I=Jd(J,y);I&&y.beforeEnter(M),i(M,v,$),((_=D&&D.onVnodeMounted)||I||A)&&Ke(()=>{_&&Mn(_,tt,R),I&&y.enter(M),A&&gi(R,null,tt,"mounted")},J)},L=(R,v,$,tt,J)=>{if($&&p(R,$),tt)for(let W=0;W<tt.length;W++)p(R,tt[W]);if(J){let W=J.subTree;if(v===W||Th(W.type)&&(W.ssContent===v||W.ssFallback===v)){const ct=J.vnode;L(R,ct,ct.scopeId,ct.slotScopeIds,J.parent)}}},V=(R,v,$,tt,J,W,ct,Q,M=0)=>{for(let _=M;_<R.length;_++){const D=R[_]=Q?ii(R[_]):En(R[_]);S(null,D,v,$,tt,J,W,ct,Q)}},w=(R,v,$,tt,J,W,ct)=>{const Q=v.el=R.el;let{patchFlag:M,dynamicChildren:_,dirs:D}=v;M|=R.patchFlag&16;const m=R.props||ue,y=v.props||ue;let A;if($&&vi($,!1),(A=y.onVnodeBeforeUpdate)&&Mn(A,$,v,R),D&&gi(v,R,$,"beforeUpdate"),$&&vi($,!0),(m.innerHTML&&y.innerHTML==null||m.textContent&&y.textContent==null)&&u(Q,""),_?T(R.dynamicChildren,_,Q,$,tt,Co(v,J),W):ct||G(R,v,Q,null,$,tt,Co(v,J),W,!1),M>0){if(M&16)U(Q,m,y,$,J);else if(M&2&&m.class!==y.class&&s(Q,"class",null,y.class,J),M&4&&s(Q,"style",m.style,y.style,J),M&8){const I=v.dynamicProps;for(let z=0;z<I.length;z++){const Y=I[z],ht=m[Y],X=y[Y];(X!==ht||Y==="value")&&s(Q,Y,ht,X,J,$)}}M&1&&R.children!==v.children&&u(Q,v.children)}else!ct&&_==null&&U(Q,m,y,$,J);((A=y.onVnodeUpdated)||D)&&Ke(()=>{A&&Mn(A,$,v,R),D&&gi(v,R,$,"updated")},tt)},T=(R,v,$,tt,J,W,ct)=>{for(let Q=0;Q<v.length;Q++){const M=R[Q],_=v[Q],D=M.el&&(M.type===Bn||!wr(M,_)||M.shapeFlag&70)?h(M.el):$;S(M,_,D,null,tt,J,W,ct,!0)}},U=(R,v,$,tt,J)=>{if(v!==$){if(v!==ue)for(const W in v)!Fr(W)&&!(W in $)&&s(R,W,v[W],null,J,tt);for(const W in $){if(Fr(W))continue;const ct=$[W],Q=v[W];ct!==Q&&W!=="value"&&s(R,W,Q,ct,J,tt)}"value"in $&&s(R,"value",v.value,$.value,J)}},rt=(R,v,$,tt,J,W,ct,Q,M)=>{const _=v.el=R?R.el:a(""),D=v.anchor=R?R.anchor:a("");let{patchFlag:m,dynamicChildren:y,slotScopeIds:A}=v;A&&(Q=Q?Q.concat(A):A),R==null?(i(_,$,tt),i(D,$,tt),V(v.children||[],$,D,J,W,ct,Q,M)):m>0&&m&64&&y&&R.dynamicChildren?(T(R.dynamicChildren,y,$,J,W,ct,Q),(v.key!=null||J&&v===J.subTree)&&xh(R,v,!0)):G(R,v,$,D,J,W,ct,Q,M)},Z=(R,v,$,tt,J,W,ct,Q,M)=>{v.slotScopeIds=Q,R==null?v.shapeFlag&512?J.ctx.activate(v,$,tt,ct,M):ot(v,$,tt,J,W,ct,M):at(R,v,M)},ot=(R,v,$,tt,J,W,ct)=>{const Q=R.component=vp(R,tt,J);if(sh(R)&&(Q.ctx.renderer=Bt),xp(Q,!1,ct),Q.asyncDep){if(J&&J.registerDep(Q,et,ct),!R.el){const M=Q.subTree=ci(Kr);f(null,M,v,$)}}else et(Q,R,v,$,J,W,ct)},at=(R,v,$)=>{const tt=v.component=R.component;if(ap(R,v,$))if(tt.asyncDep&&!tt.asyncResolved){nt(tt,v,$);return}else tt.next=v,tt.update();else v.el=R.el,tt.vnode=v},et=(R,v,$,tt,J,W,ct)=>{const Q=()=>{if(R.isMounted){let{next:m,bu:y,u:A,parent:I,vnode:z}=R;{const ut=Mh(R);if(ut){m&&(m.el=z.el,nt(R,m,ct)),ut.asyncDep.then(()=>{R.isUnmounted||Q()});return}}let Y=m,ht;vi(R,!1),m?(m.el=z.el,nt(R,m,ct)):m=z,y&&To(y),(ht=m.props&&m.props.onVnodeBeforeUpdate)&&Mn(ht,I,m,z),vi(R,!0);const X=Do(R),lt=R.subTree;R.subTree=X,S(lt,X,h(lt.el),gt(lt),R,J,W),m.el=X.el,Y===null&&lp(R,X.el),A&&Ke(A,J),(ht=m.props&&m.props.onVnodeUpdated)&&Ke(()=>Mn(ht,I,m,z),J)}else{let m;const{el:y,props:A}=v,{bm:I,m:z,parent:Y,root:ht,type:X}=R,lt=Hr(v);if(vi(R,!1),I&&To(I),!lt&&(m=A&&A.onVnodeBeforeMount)&&Mn(m,Y,v),vi(R,!0),y&&qt){const ut=()=>{R.subTree=Do(R),qt(y,R.subTree,R,J,null)};lt&&X.__asyncHydrate?X.__asyncHydrate(y,R,ut):ut()}else{ht.ce&&ht.ce._injectChildStyle(X);const ut=R.subTree=Do(R);S(null,ut,$,tt,R,J,W),v.el=ut.el}if(z&&Ke(z,J),!lt&&(m=A&&A.onVnodeMounted)){const ut=v;Ke(()=>Mn(m,Y,ut),J)}(v.shapeFlag&256||Y&&Hr(Y.vnode)&&Y.vnode.shapeFlag&256)&&R.a&&Ke(R.a,J),R.isMounted=!0,v=$=tt=null}};R.scope.on();const M=R.effect=new Fu(Q);R.scope.off();const _=R.update=M.run.bind(M),D=R.job=M.runIfDirty.bind(M);D.i=R,D.id=R.uid,M.scheduler=()=>Cl(D),vi(R,!0),_()},nt=(R,v,$)=>{v.component=R;const tt=R.vnode.props;R.vnode=v,R.next=null,Xd(R,v.props,tt,$),Kd(R,v.children,$),di(),ic(R),pi()},G=(R,v,$,tt,J,W,ct,Q,M=!1)=>{const _=R&&R.children,D=R?R.shapeFlag:0,m=v.children,{patchFlag:y,shapeFlag:A}=v;if(y>0){if(y&128){St(_,m,$,tt,J,W,ct,Q,M);return}else if(y&256){mt(_,m,$,tt,J,W,ct,Q,M);return}}A&8?(D&16&&At(_,J,W),m!==_&&u($,m)):D&16?A&16?St(_,m,$,tt,J,W,ct,Q,M):At(_,J,W,!0):(D&8&&u($,""),A&16&&V(m,$,tt,J,W,ct,Q,M))},mt=(R,v,$,tt,J,W,ct,Q,M)=>{R=R||sr,v=v||sr;const _=R.length,D=v.length,m=Math.min(_,D);let y;for(y=0;y<m;y++){const A=v[y]=M?ii(v[y]):En(v[y]);S(R[y],A,$,null,J,W,ct,Q,M)}_>D?At(R,J,W,!0,!1,m):V(v,$,tt,J,W,ct,Q,M,m)},St=(R,v,$,tt,J,W,ct,Q,M)=>{let _=0;const D=v.length;let m=R.length-1,y=D-1;for(;_<=m&&_<=y;){const A=R[_],I=v[_]=M?ii(v[_]):En(v[_]);if(wr(A,I))S(A,I,$,null,J,W,ct,Q,M);else break;_++}for(;_<=m&&_<=y;){const A=R[m],I=v[y]=M?ii(v[y]):En(v[y]);if(wr(A,I))S(A,I,$,null,J,W,ct,Q,M);else break;m--,y--}if(_>m){if(_<=y){const A=y+1,I=A<D?v[A].el:tt;for(;_<=y;)S(null,v[_]=M?ii(v[_]):En(v[_]),$,I,J,W,ct,Q,M),_++}}else if(_>y)for(;_<=m;)Ut(R[_],J,W,!0),_++;else{const A=_,I=_,z=new Map;for(_=I;_<=y;_++){const wt=v[_]=M?ii(v[_]):En(v[_]);wt.key!=null&&z.set(wt.key,_)}let Y,ht=0;const X=y-I+1;let lt=!1,ut=0;const Et=new Array(X);for(_=0;_<X;_++)Et[_]=0;for(_=A;_<=m;_++){const wt=R[_];if(ht>=X){Ut(wt,J,W,!0);continue}let Rt;if(wt.key!=null)Rt=z.get(wt.key);else for(Y=I;Y<=y;Y++)if(Et[Y-I]===0&&wr(wt,v[Y])){Rt=Y;break}Rt===void 0?Ut(wt,J,W,!0):(Et[Rt-I]=_+1,Rt>=ut?ut=Rt:lt=!0,S(wt,v[Rt],$,null,J,W,ct,Q,M),ht++)}const dt=lt?Qd(Et):sr;for(Y=dt.length-1,_=X-1;_>=0;_--){const wt=I+_,Rt=v[wt],Ot=wt+1<D?v[wt+1].el:tt;Et[_]===0?S(null,Rt,$,Ot,J,W,ct,Q,M):lt&&(Y<0||_!==dt[Y]?xt(Rt,$,Ot,2):Y--)}}},xt=(R,v,$,tt,J=null)=>{const{el:W,type:ct,transition:Q,children:M,shapeFlag:_}=R;if(_&6){xt(R.component.subTree,v,$,tt);return}if(_&128){R.suspense.move(v,$,tt);return}if(_&64){ct.move(R,v,$,Bt);return}if(ct===Bn){i(W,v,$);for(let m=0;m<M.length;m++)xt(M[m],v,$,tt);i(R.anchor,v,$);return}if(ct===Lo){C(R,v,$);return}if(tt!==2&&_&1&&Q)if(tt===0)Q.beforeEnter(W),i(W,v,$),Ke(()=>Q.enter(W),J);else{const{leave:m,delayLeave:y,afterLeave:A}=Q,I=()=>i(W,v,$),z=()=>{m(W,()=>{I(),A&&A()})};y?y(W,I,z):z()}else i(W,v,$)},Ut=(R,v,$,tt=!1,J=!1)=>{const{type:W,props:ct,ref:Q,children:M,dynamicChildren:_,shapeFlag:D,patchFlag:m,dirs:y,cacheIndex:A}=R;if(m===-2&&(J=!1),Q!=null&&Zs(Q,null,$,R,!0),A!=null&&(v.renderCache[A]=void 0),D&256){v.ctx.deactivate(R);return}const I=D&1&&y,z=!Hr(R);let Y;if(z&&(Y=ct&&ct.onVnodeBeforeUnmount)&&Mn(Y,v,R),D&6)ft(R.component,$,tt);else{if(D&128){R.suspense.unmount($,tt);return}I&&gi(R,null,v,"beforeUnmount"),D&64?R.type.remove(R,v,$,Bt,tt):_&&!_.hasOnce&&(W!==Bn||m>0&&m&64)?At(_,v,$,!1,!0):(W===Bn&&m&384||!J&&D&16)&&At(M,v,$),tt&&Kt(R)}(z&&(Y=ct&&ct.onVnodeUnmounted)||I)&&Ke(()=>{Y&&Mn(Y,v,R),I&&gi(R,null,v,"unmounted")},$)},Kt=R=>{const{type:v,el:$,anchor:tt,transition:J}=R;if(v===Bn){it($,tt);return}if(v===Lo){b(R);return}const W=()=>{r($),J&&!J.persisted&&J.afterLeave&&J.afterLeave()};if(R.shapeFlag&1&&J&&!J.persisted){const{leave:ct,delayLeave:Q}=J,M=()=>ct($,W);Q?Q(R.el,W,M):M()}else W()},it=(R,v)=>{let $;for(;R!==v;)$=d(R),r(R),R=$;r(v)},ft=(R,v,$)=>{const{bum:tt,scope:J,job:W,subTree:ct,um:Q,m:M,a:_}=R;uc(M),uc(_),tt&&To(tt),J.stop(),W&&(W.flags|=8,Ut(ct,R,v,$)),Q&&Ke(Q,v),Ke(()=>{R.isUnmounted=!0},v),v&&v.pendingBranch&&!v.isUnmounted&&R.asyncDep&&!R.asyncResolved&&R.suspenseId===v.pendingId&&(v.deps--,v.deps===0&&v.resolve())},At=(R,v,$,tt=!1,J=!1,W=0)=>{for(let ct=W;ct<R.length;ct++)Ut(R[ct],v,$,tt,J)},gt=R=>{if(R.shapeFlag&6)return gt(R.component.subTree);if(R.shapeFlag&128)return R.suspense.next();const v=d(R.anchor||R.el),$=v&&v[gd];return $?d($):v};let Dt=!1;const Ft=(R,v,$)=>{R==null?v._vnode&&Ut(v._vnode,null,null,!0):S(v._vnode||null,R,v,null,null,null,$),v._vnode=R,Dt||(Dt=!0,ic(),eh(),Dt=!1)},Bt={p:S,um:Ut,m:xt,r:Kt,mt:ot,mc:V,pc:G,pbc:T,n:gt,o:n};let Zt,qt;return{render:Ft,hydrate:Zt,createApp:Gd(Ft,Zt)}}function Co({type:n,props:t},e){return e==="svg"&&n==="foreignObject"||e==="mathml"&&n==="annotation-xml"&&t&&t.encoding&&t.encoding.includes("html")?void 0:e}function vi({effect:n,job:t},e){e?(n.flags|=32,t.flags|=4):(n.flags&=-33,t.flags&=-5)}function Jd(n,t){return(!n||n&&!n.pendingBranch)&&t&&!t.persisted}function xh(n,t,e=!1){const i=n.children,r=t.children;if(Xt(i)&&Xt(r))for(let s=0;s<i.length;s++){const o=i[s];let a=r[s];a.shapeFlag&1&&!a.dynamicChildren&&((a.patchFlag<=0||a.patchFlag===32)&&(a=r[s]=ii(r[s]),a.el=o.el),!e&&a.patchFlag!==-2&&xh(o,a)),a.type===po&&(a.el=o.el)}}function Qd(n){const t=n.slice(),e=[0];let i,r,s,o,a;const l=n.length;for(i=0;i<l;i++){const c=n[i];if(c!==0){if(r=e[e.length-1],n[r]<c){t[i]=r,e.push(i);continue}for(s=0,o=e.length-1;s<o;)a=s+o>>1,n[e[a]]<c?s=a+1:o=a;c<n[e[s]]&&(s>0&&(t[i]=e[s-1]),e[s]=i)}}for(s=e.length,o=e[s-1];s-- >0;)e[s]=o,o=t[o];return e}function Mh(n){const t=n.subTree.component;if(t)return t.asyncDep&&!t.asyncResolved?t:Mh(t)}function uc(n){if(n)for(let t=0;t<n.length;t++)n[t].flags|=8}const tp=Symbol.for("v-scx"),ep=()=>zs(tp);function Po(n,t,e){return Sh(n,t,e)}function Sh(n,t,e=ue){const{immediate:i,deep:r,flush:s,once:o}=e,a=Ce({},e),l=t&&i||!t&&s!=="post";let c;if(Zr){if(s==="sync"){const p=ep();c=p.__watcherHandles||(p.__watcherHandles=[])}else if(!l){const p=()=>{};return p.stop=bn,p.resume=bn,p.pause=bn,p}}const u=Ue;a.call=(p,x,S)=>Rn(p,u,x,S);let h=!1;s==="post"?a.scheduler=p=>{Ke(p,u&&u.suspense)}:s!=="sync"&&(h=!0,a.scheduler=(p,x)=>{x?p():Cl(p)}),a.augmentJob=p=>{t&&(p.flags|=4),h&&(p.flags|=2,u&&(p.id=u.uid,p.i=u))};const d=hd(n,t,a);return Zr&&(c?c.push(d):l&&d()),d}function np(n,t,e){const i=this.proxy,r=we(n)?n.includes(".")?Eh(i,n):()=>i[n]:n.bind(i,i);let s;Wt(t)?s=t:(s=t.handler,e=t);const o=ns(this),a=Sh(r,s.bind(i),e);return o(),a}function Eh(n,t){const e=t.split(".");return()=>{let i=n;for(let r=0;r<e.length&&i;r++)i=i[e[r]];return i}}const ip=(n,t)=>t==="modelValue"||t==="model-value"?n.modelModifiers:n[`${t}Modifiers`]||n[`${ln(t)}Modifiers`]||n[`${Fi(t)}Modifiers`];function rp(n,t,...e){if(n.isUnmounted)return;const i=n.vnode.props||ue;let r=e;const s=t.startsWith("update:"),o=s&&ip(i,t.slice(7));o&&(o.trim&&(r=e.map(u=>we(u)?u.trim():u)),o.number&&(r=e.map(Df)));let a,l=i[a=yo(t)]||i[a=yo(ln(t))];!l&&s&&(l=i[a=yo(Fi(t))]),l&&Rn(l,n,6,r);const c=i[a+"Once"];if(c){if(!n.emitted)n.emitted={};else if(n.emitted[a])return;n.emitted[a]=!0,Rn(c,n,6,r)}}function yh(n,t,e=!1){const i=t.emitsCache,r=i.get(n);if(r!==void 0)return r;const s=n.emits;let o={},a=!1;if(!Wt(n)){const l=c=>{const u=yh(c,t,!0);u&&(a=!0,Ce(o,u))};!e&&t.mixins.length&&t.mixins.forEach(l),n.extends&&l(n.extends),n.mixins&&n.mixins.forEach(l)}return!s&&!a?(Se(n)&&i.set(n,null),null):(Xt(s)?s.forEach(l=>o[l]=null):Ce(o,s),Se(n)&&i.set(n,o),o)}function fo(n,t){return!n||!so(t)?!1:(t=t.slice(2).replace(/Once$/,""),re(n,t[0].toLowerCase()+t.slice(1))||re(n,Fi(t))||re(n,t))}function Do(n){const{type:t,vnode:e,proxy:i,withProxy:r,propsOptions:[s],slots:o,attrs:a,emit:l,render:c,renderCache:u,props:h,data:d,setupState:p,ctx:x,inheritAttrs:S}=n,g=$s(n);let f,P;try{if(e.shapeFlag&4){const b=r||i,O=b;f=En(c.call(O,b,u,h,p,d,x)),P=a}else{const b=t;f=En(b.length>1?b(h,{attrs:a,slots:o,emit:l}):b(h,null)),P=t.props?a:sp(a)}}catch(b){Gr.length=0,uo(b,n,1),f=ci(Kr)}let C=f;if(P&&S!==!1){const b=Object.keys(P),{shapeFlag:O}=C;b.length&&O&7&&(s&&b.some(_l)&&(P=op(P,s)),C=dr(C,P,!1,!0))}return e.dirs&&(C=dr(C,null,!1,!0),C.dirs=C.dirs?C.dirs.concat(e.dirs):e.dirs),e.transition&&Pl(C,e.transition),f=C,$s(g),f}const sp=n=>{let t;for(const e in n)(e==="class"||e==="style"||so(e))&&((t||(t={}))[e]=n[e]);return t},op=(n,t)=>{const e={};for(const i in n)(!_l(i)||!(i.slice(9)in t))&&(e[i]=n[i]);return e};function ap(n,t,e){const{props:i,children:r,component:s}=n,{props:o,children:a,patchFlag:l}=t,c=s.emitsOptions;if(t.dirs||t.transition)return!0;if(e&&l>=0){if(l&1024)return!0;if(l&16)return i?hc(i,o,c):!!o;if(l&8){const u=t.dynamicProps;for(let h=0;h<u.length;h++){const d=u[h];if(o[d]!==i[d]&&!fo(c,d))return!0}}}else return(r||a)&&(!a||!a.$stable)?!0:i===o?!1:i?o?hc(i,o,c):!0:!!o;return!1}function hc(n,t,e){const i=Object.keys(t);if(i.length!==Object.keys(n).length)return!0;for(let r=0;r<i.length;r++){const s=i[r];if(t[s]!==n[s]&&!fo(e,s))return!0}return!1}function lp({vnode:n,parent:t},e){for(;t;){const i=t.subTree;if(i.suspense&&i.suspense.activeBranch===n&&(i.el=n.el),i===n)(n=t.vnode).el=e,t=t.parent;else break}}const Th=n=>n.__isSuspense;function cp(n,t){t&&t.pendingBranch?Xt(n)?t.effects.push(...n):t.effects.push(n):md(n)}const Bn=Symbol.for("v-fgt"),po=Symbol.for("v-txt"),Kr=Symbol.for("v-cmt"),Lo=Symbol.for("v-stc"),Gr=[];let Qe=null;function bh(n=!1){Gr.push(Qe=n?null:[])}function up(){Gr.pop(),Qe=Gr[Gr.length-1]||null}let $r=1;function fc(n,t=!1){$r+=n,n<0&&Qe&&t&&(Qe.hasOnce=!0)}function hp(n){return n.dynamicChildren=$r>0?Qe||sr:null,up(),$r>0&&Qe&&Qe.push(n),n}function Ah(n,t,e,i,r,s){return hp(kr(n,t,e,i,r,s,!0))}function wh(n){return n?n.__v_isVNode===!0:!1}function wr(n,t){return n.type===t.type&&n.key===t.key}const Rh=({key:n})=>n??null,Hs=({ref:n,ref_key:t,ref_for:e})=>(typeof n=="number"&&(n=""+n),n!=null?we(n)||He(n)||Wt(n)?{i:_n,r:n,k:t,f:!!e}:n:null);function kr(n,t=null,e=null,i=0,r=null,s=n===Bn?0:1,o=!1,a=!1){const l={__v_isVNode:!0,__v_skip:!0,type:n,props:t,key:t&&Rh(t),ref:t&&Hs(t),scopeId:ih,slotScopeIds:null,children:e,component:null,suspense:null,ssContent:null,ssFallback:null,dirs:null,transition:null,el:null,anchor:null,target:null,targetStart:null,targetAnchor:null,staticCount:0,shapeFlag:s,patchFlag:i,dynamicProps:r,dynamicChildren:null,appContext:null,ctx:_n};return a?(Il(l,e),s&128&&n.normalize(l)):e&&(l.shapeFlag|=we(e)?8:16),$r>0&&!o&&Qe&&(l.patchFlag>0||s&6)&&l.patchFlag!==32&&Qe.push(l),l}const ci=fp;function fp(n,t=null,e=null,i=0,r=null,s=!1){if((!n||n===Id)&&(n=Kr),wh(n)){const a=dr(n,t,!0);return e&&Il(a,e),$r>0&&!s&&Qe&&(a.shapeFlag&6?Qe[Qe.indexOf(n)]=a:Qe.push(a)),a.patchFlag=-2,a}if(Tp(n)&&(n=n.__vccOpts),t){t=dp(t);let{class:a,style:l}=t;a&&!we(a)&&(t.class=Ml(a)),Se(l)&&(Rl(l)&&!Xt(l)&&(l=Ce({},l)),t.style=xl(l))}const o=we(n)?1:Th(n)?128:vd(n)?64:Se(n)?4:Wt(n)?2:0;return kr(n,t,e,i,r,o,s,!0)}function dp(n){return n?Rl(n)||fh(n)?Ce({},n):n:null}function dr(n,t,e=!1,i=!1){const{props:r,ref:s,patchFlag:o,children:a,transition:l}=n,c=t?mp(r||{},t):r,u={__v_isVNode:!0,__v_skip:!0,type:n.type,props:c,key:c&&Rh(c),ref:t&&t.ref?e&&s?Xt(s)?s.concat(Hs(t)):[s,Hs(t)]:Hs(t):s,scopeId:n.scopeId,slotScopeIds:n.slotScopeIds,children:a,target:n.target,targetStart:n.targetStart,targetAnchor:n.targetAnchor,staticCount:n.staticCount,shapeFlag:n.shapeFlag,patchFlag:t&&n.type!==Bn?o===-1?16:o|16:o,dynamicProps:n.dynamicProps,dynamicChildren:n.dynamicChildren,appContext:n.appContext,dirs:n.dirs,transition:l,component:n.component,suspense:n.suspense,ssContent:n.ssContent&&dr(n.ssContent),ssFallback:n.ssFallback&&dr(n.ssFallback),el:n.el,anchor:n.anchor,ctx:n.ctx,ce:n.ce};return l&&i&&Pl(u,l.clone(u)),u}function pp(n=" ",t=0){return ci(po,null,n,t)}function En(n){return n==null||typeof n=="boolean"?ci(Kr):Xt(n)?ci(Bn,null,n.slice()):wh(n)?ii(n):ci(po,null,String(n))}function ii(n){return n.el===null&&n.patchFlag!==-1||n.memo?n:dr(n)}function Il(n,t){let e=0;const{shapeFlag:i}=n;if(t==null)t=null;else if(Xt(t))e=16;else if(typeof t=="object")if(i&65){const r=t.default;r&&(r._c&&(r._d=!1),Il(n,r()),r._c&&(r._d=!0));return}else{e=32;const r=t._;!r&&!fh(t)?t._ctx=_n:r===3&&_n&&(_n.slots._===1?t._=1:(t._=2,n.patchFlag|=1024))}else Wt(t)?(t={default:t,_ctx:_n},e=32):(t=String(t),i&64?(e=16,t=[pp(t)]):e=8);n.children=t,n.shapeFlag|=e}function mp(...n){const t={};for(let e=0;e<n.length;e++){const i=n[e];for(const r in i)if(r==="class")t.class!==i.class&&(t.class=Ml([t.class,i.class]));else if(r==="style")t.style=xl([t.style,i.style]);else if(so(r)){const s=t[r],o=i[r];o&&s!==o&&!(Xt(s)&&s.includes(o))&&(t[r]=s?[].concat(s,o):o)}else r!==""&&(t[r]=i[r])}return t}function Mn(n,t,e,i=null){Rn(n,t,7,[e,i])}const _p=ch();let gp=0;function vp(n,t,e){const i=n.type,r=(t?t.appContext:n.appContext)||_p,s={uid:gp++,vnode:n,type:i,parent:t,appContext:r,root:null,next:null,subTree:null,effect:null,update:null,job:null,scope:new Bf(!0),render:null,proxy:null,exposed:null,exposeProxy:null,withProxy:null,provides:t?t.provides:Object.create(r.provides),ids:t?t.ids:["",0,0],accessCache:null,renderCache:[],components:null,directives:null,propsOptions:ph(i,r),emitsOptions:yh(i,r),emit:null,emitted:null,propsDefaults:ue,inheritAttrs:i.inheritAttrs,ctx:ue,data:ue,props:ue,attrs:ue,slots:ue,refs:ue,setupState:ue,setupContext:null,suspense:e,suspenseId:e?e.pendingId:0,asyncDep:null,asyncResolved:!1,isMounted:!1,isUnmounted:!1,isDeactivated:!1,bc:null,c:null,bm:null,m:null,bu:null,u:null,um:null,bum:null,da:null,a:null,rtg:null,rtc:null,ec:null,sp:null};return s.ctx={_:s},s.root=t?t.root:s,s.emit=rp.bind(null,s),n.ce&&n.ce(s),s}let Ue=null,Qs,Sa;{const n=co(),t=(e,i)=>{let r;return(r=n[e])||(r=n[e]=[]),r.push(i),s=>{r.length>1?r.forEach(o=>o(s)):r[0](s)}};Qs=t("__VUE_INSTANCE_SETTERS__",e=>Ue=e),Sa=t("__VUE_SSR_SETTERS__",e=>Zr=e)}const ns=n=>{const t=Ue;return Qs(n),n.scope.on(),()=>{n.scope.off(),Qs(t)}},dc=()=>{Ue&&Ue.scope.off(),Qs(null)};function Ch(n){return n.vnode.shapeFlag&4}let Zr=!1;function xp(n,t=!1,e=!1){t&&Sa(t);const{props:i,children:r}=n.vnode,s=Ch(n);Wd(n,i,s,t),jd(n,r,e);const o=s?Mp(n,t):void 0;return t&&Sa(!1),o}function Mp(n,t){const e=n.type;n.accessCache=Object.create(null),n.proxy=new Proxy(n.ctx,Nd);const{setup:i}=e;if(i){di();const r=n.setupContext=i.length>1?Ep(n):null,s=ns(n),o=es(i,n,0,[n.props,r]),a=Iu(o);if(pi(),s(),(a||n.sp)&&!Hr(n)&&rh(n),a){if(o.then(dc,dc),t)return o.then(l=>{pc(n,l,t)}).catch(l=>{uo(l,n,0)});n.asyncDep=o}else pc(n,o,t)}else Ph(n,t)}function pc(n,t,e){Wt(t)?n.type.__ssrInlineRender?n.ssrRender=t:n.render=t:Se(t)&&(n.setupState=Ju(t)),Ph(n,e)}let mc;function Ph(n,t,e){const i=n.type;if(!n.render){if(!t&&mc&&!i.render){const r=i.template||Dl(n).template;if(r){const{isCustomElement:s,compilerOptions:o}=n.appContext.config,{delimiters:a,compilerOptions:l}=i,c=Ce(Ce({isCustomElement:s,delimiters:a},o),l);i.render=mc(r,c)}}n.render=i.render||bn}{const r=ns(n);di();try{Fd(n)}finally{pi(),r()}}}const Sp={get(n,t){return Ie(n,"get",""),n[t]}};function Ep(n){const t=e=>{n.exposed=e||{}};return{attrs:new Proxy(n.attrs,Sp),slots:n.slots,emit:n.emit,expose:t}}function Ul(n){return n.exposed?n.exposeProxy||(n.exposeProxy=new Proxy(Ju(sd(n.exposed)),{get(t,e){if(e in t)return t[e];if(e in Vr)return Vr[e](n)},has(t,e){return e in t||e in Vr}})):n.proxy}function yp(n,t=!0){return Wt(n)?n.displayName||n.name:n.name||t&&n.__name}function Tp(n){return Wt(n)&&"__vccOpts"in n}const bp=(n,t)=>cd(n,t,Zr),Ap="3.5.13";/**
* @vue/runtime-dom v3.5.13
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/let Ea;const _c=typeof window<"u"&&window.trustedTypes;if(_c)try{Ea=_c.createPolicy("vue",{createHTML:n=>n})}catch{}const Dh=Ea?n=>Ea.createHTML(n):n=>n,wp="http://www.w3.org/2000/svg",Rp="http://www.w3.org/1998/Math/MathML",On=typeof document<"u"?document:null,gc=On&&On.createElement("template"),Cp={insert:(n,t,e)=>{t.insertBefore(n,e||null)},remove:n=>{const t=n.parentNode;t&&t.removeChild(n)},createElement:(n,t,e,i)=>{const r=t==="svg"?On.createElementNS(wp,n):t==="mathml"?On.createElementNS(Rp,n):e?On.createElement(n,{is:e}):On.createElement(n);return n==="select"&&i&&i.multiple!=null&&r.setAttribute("multiple",i.multiple),r},createText:n=>On.createTextNode(n),createComment:n=>On.createComment(n),setText:(n,t)=>{n.nodeValue=t},setElementText:(n,t)=>{n.textContent=t},parentNode:n=>n.parentNode,nextSibling:n=>n.nextSibling,querySelector:n=>On.querySelector(n),setScopeId(n,t){n.setAttribute(t,"")},insertStaticContent(n,t,e,i,r,s){const o=e?e.previousSibling:t.lastChild;if(r&&(r===s||r.nextSibling))for(;t.insertBefore(r.cloneNode(!0),e),!(r===s||!(r=r.nextSibling)););else{gc.innerHTML=Dh(i==="svg"?`<svg>${n}</svg>`:i==="mathml"?`<math>${n}</math>`:n);const a=gc.content;if(i==="svg"||i==="mathml"){const l=a.firstChild;for(;l.firstChild;)a.appendChild(l.firstChild);a.removeChild(l)}t.insertBefore(a,e)}return[o?o.nextSibling:t.firstChild,e?e.previousSibling:t.lastChild]}},Pp=Symbol("_vtc");function Dp(n,t,e){const i=n[Pp];i&&(t=(t?[t,...i]:[...i]).join(" ")),t==null?n.removeAttribute("class"):e?n.setAttribute("class",t):n.className=t}const vc=Symbol("_vod"),Lp=Symbol("_vsh"),Ip=Symbol(""),Up=/(^|;)\s*display\s*:/;function Np(n,t,e){const i=n.style,r=we(e);let s=!1;if(e&&!r){if(t)if(we(t))for(const o of t.split(";")){const a=o.slice(0,o.indexOf(":")).trim();e[a]==null&&Vs(i,a,"")}else for(const o in t)e[o]==null&&Vs(i,o,"");for(const o in e)o==="display"&&(s=!0),Vs(i,o,e[o])}else if(r){if(t!==e){const o=i[Ip];o&&(e+=";"+o),i.cssText=e,s=Up.test(e)}}else t&&n.removeAttribute("style");vc in n&&(n[vc]=s?i.display:"",n[Lp]&&(i.display="none"))}const xc=/\s*!important$/;function Vs(n,t,e){if(Xt(e))e.forEach(i=>Vs(n,t,i));else if(e==null&&(e=""),t.startsWith("--"))n.setProperty(t,e);else{const i=Fp(n,t);xc.test(e)?n.setProperty(Fi(i),e.replace(xc,""),"important"):n[i]=e}}const Mc=["Webkit","Moz","ms"],Io={};function Fp(n,t){const e=Io[t];if(e)return e;let i=ln(t);if(i!=="filter"&&i in n)return Io[t]=i;i=lo(i);for(let r=0;r<Mc.length;r++){const s=Mc[r]+i;if(s in n)return Io[t]=s}return t}const Sc="http://www.w3.org/1999/xlink";function Ec(n,t,e,i,r,s=Of(t)){i&&t.startsWith("xlink:")?e==null?n.removeAttributeNS(Sc,t.slice(6,t.length)):n.setAttributeNS(Sc,t,e):e==null||s&&!Nu(e)?n.removeAttribute(t):n.setAttribute(t,s?"":Sr(e)?String(e):e)}function yc(n,t,e,i,r){if(t==="innerHTML"||t==="textContent"){e!=null&&(n[t]=t==="innerHTML"?Dh(e):e);return}const s=n.tagName;if(t==="value"&&s!=="PROGRESS"&&!s.includes("-")){const a=s==="OPTION"?n.getAttribute("value")||"":n.value,l=e==null?n.type==="checkbox"?"on":"":String(e);(a!==l||!("_value"in n))&&(n.value=l),e==null&&n.removeAttribute(t),n._value=e;return}let o=!1;if(e===""||e==null){const a=typeof n[t];a==="boolean"?e=Nu(e):e==null&&a==="string"?(e="",o=!0):a==="number"&&(e=0,o=!0)}try{n[t]=e}catch{}o&&n.removeAttribute(r||t)}function Op(n,t,e,i){n.addEventListener(t,e,i)}function Bp(n,t,e,i){n.removeEventListener(t,e,i)}const Tc=Symbol("_vei");function zp(n,t,e,i,r=null){const s=n[Tc]||(n[Tc]={}),o=s[t];if(i&&o)o.value=i;else{const[a,l]=Hp(t);if(i){const c=s[t]=kp(i,r);Op(n,a,c,l)}else o&&(Bp(n,a,o,l),s[t]=void 0)}}const bc=/(?:Once|Passive|Capture)$/;function Hp(n){let t;if(bc.test(n)){t={};let i;for(;i=n.match(bc);)n=n.slice(0,n.length-i[0].length),t[i[0].toLowerCase()]=!0}return[n[2]===":"?n.slice(3):Fi(n.slice(2)),t]}let Uo=0;const Vp=Promise.resolve(),Gp=()=>Uo||(Vp.then(()=>Uo=0),Uo=Date.now());function kp(n,t){const e=i=>{if(!i._vts)i._vts=Date.now();else if(i._vts<=e.attached)return;Rn(Wp(i,e.value),t,5,[i])};return e.value=n,e.attached=Gp(),e}function Wp(n,t){if(Xt(t)){const e=n.stopImmediatePropagation;return n.stopImmediatePropagation=()=>{e.call(n),n._stopped=!0},t.map(i=>r=>!r._stopped&&i&&i(r))}else return t}const Ac=n=>n.charCodeAt(0)===111&&n.charCodeAt(1)===110&&n.charCodeAt(2)>96&&n.charCodeAt(2)<123,Xp=(n,t,e,i,r,s)=>{const o=r==="svg";t==="class"?Dp(n,i,o):t==="style"?Np(n,e,i):so(t)?_l(t)||zp(n,t,e,i,s):(t[0]==="."?(t=t.slice(1),!0):t[0]==="^"?(t=t.slice(1),!1):qp(n,t,i,o))?(yc(n,t,i),!n.tagName.includes("-")&&(t==="value"||t==="checked"||t==="selected")&&Ec(n,t,i,o,s,t!=="value")):n._isVueCE&&(/[A-Z]/.test(t)||!we(i))?yc(n,ln(t),i,s,t):(t==="true-value"?n._trueValue=i:t==="false-value"&&(n._falseValue=i),Ec(n,t,i,o))};function qp(n,t,e,i){if(i)return!!(t==="innerHTML"||t==="textContent"||t in n&&Ac(t)&&Wt(e));if(t==="spellcheck"||t==="draggable"||t==="translate"||t==="form"||t==="list"&&n.tagName==="INPUT"||t==="type"&&n.tagName==="TEXTAREA")return!1;if(t==="width"||t==="height"){const r=n.tagName;if(r==="IMG"||r==="VIDEO"||r==="CANVAS"||r==="SOURCE")return!1}return Ac(t)&&we(e)?!1:t in n}const Yp=Ce({patchProp:Xp},Cp);let wc;function jp(){return wc||(wc=$d(Yp))}const Kp=(...n)=>{const t=jp().createApp(...n),{mount:e}=t;return t.mount=i=>{const r=Zp(i);if(!r)return;const s=t._component;!Wt(s)&&!s.render&&!s.template&&(s.template=r.innerHTML),r.nodeType===1&&(r.textContent="");const o=e(r,!1,$p(r));return r instanceof Element&&(r.removeAttribute("v-cloak"),r.setAttribute("data-v-app","")),o},t};function $p(n){if(n instanceof SVGElement)return"svg";if(typeof MathMLElement=="function"&&n instanceof MathMLElement)return"mathml"}function Zp(n){return we(n)?document.querySelector(n):n}/**
 * @license
 * Copyright 2010-2024 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const Nl="171",lr={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},ir={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},Jp=0,Rc=1,Qp=2,Lh=1,tm=2,Fn=3,fi=0,We=1,Hn=2,ui=0,cr=1,Cc=2,Pc=3,Dc=4,em=5,wi=100,nm=101,im=102,rm=103,sm=104,om=200,am=201,lm=202,cm=203,ya=204,Ta=205,um=206,hm=207,fm=208,dm=209,pm=210,mm=211,_m=212,gm=213,vm=214,ba=0,Aa=1,wa=2,pr=3,Ra=4,Ca=5,Pa=6,Da=7,Ih=0,xm=1,Mm=2,hi=0,Sm=1,Em=2,ym=3,Tm=4,bm=5,Am=6,wm=7,Uh=300,mr=301,_r=302,La=303,Ia=304,mo=306,Ua=1e3,Ci=1001,Na=1002,xn=1003,Rm=1004,fs=1005,Tn=1006,No=1007,Pi=1008,Xn=1009,Nh=1010,Fh=1011,Jr=1012,Fl=1013,Ii=1014,Vn=1015,is=1016,Ol=1017,Bl=1018,gr=1020,Oh=35902,Bh=1021,zh=1022,gn=1023,Hh=1024,Vh=1025,ur=1026,vr=1027,Gh=1028,zl=1029,kh=1030,Hl=1031,Vl=1033,Gs=33776,ks=33777,Ws=33778,Xs=33779,Fa=35840,Oa=35841,Ba=35842,za=35843,Ha=36196,Va=37492,Ga=37496,ka=37808,Wa=37809,Xa=37810,qa=37811,Ya=37812,ja=37813,Ka=37814,$a=37815,Za=37816,Ja=37817,Qa=37818,tl=37819,el=37820,nl=37821,qs=36492,il=36494,rl=36495,Wh=36283,sl=36284,ol=36285,al=36286,Cm=3200,Pm=3201,Dm=0,Lm=1,oi="",on="srgb",xr="srgb-linear",to="linear",oe="srgb",Hi=7680,Lc=519,Im=512,Um=513,Nm=514,Xh=515,Fm=516,Om=517,Bm=518,zm=519,Ic=35044,Uc="300 es",Gn=2e3,eo=2001;class Oi{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const i=this._listeners;i[t]===void 0&&(i[t]=[]),i[t].indexOf(e)===-1&&i[t].push(e)}hasEventListener(t,e){if(this._listeners===void 0)return!1;const i=this._listeners;return i[t]!==void 0&&i[t].indexOf(e)!==-1}removeEventListener(t,e){if(this._listeners===void 0)return;const r=this._listeners[t];if(r!==void 0){const s=r.indexOf(e);s!==-1&&r.splice(s,1)}}dispatchEvent(t){if(this._listeners===void 0)return;const i=this._listeners[t.type];if(i!==void 0){t.target=this;const r=i.slice(0);for(let s=0,o=r.length;s<o;s++)r[s].call(this,t);t.target=null}}}const De=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let Nc=1234567;const Wr=Math.PI/180,Qr=180/Math.PI;function Er(){const n=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(De[n&255]+De[n>>8&255]+De[n>>16&255]+De[n>>24&255]+"-"+De[t&255]+De[t>>8&255]+"-"+De[t>>16&15|64]+De[t>>24&255]+"-"+De[e&63|128]+De[e>>8&255]+"-"+De[e>>16&255]+De[e>>24&255]+De[i&255]+De[i>>8&255]+De[i>>16&255]+De[i>>24&255]).toLowerCase()}function jt(n,t,e){return Math.max(t,Math.min(e,n))}function Gl(n,t){return(n%t+t)%t}function Hm(n,t,e,i,r){return i+(n-t)*(r-i)/(e-t)}function Vm(n,t,e){return n!==t?(e-n)/(t-n):0}function Xr(n,t,e){return(1-e)*n+e*t}function Gm(n,t,e,i){return Xr(n,t,1-Math.exp(-e*i))}function km(n,t=1){return t-Math.abs(Gl(n,t*2)-t)}function Wm(n,t,e){return n<=t?0:n>=e?1:(n=(n-t)/(e-t),n*n*(3-2*n))}function Xm(n,t,e){return n<=t?0:n>=e?1:(n=(n-t)/(e-t),n*n*n*(n*(n*6-15)+10))}function qm(n,t){return n+Math.floor(Math.random()*(t-n+1))}function Ym(n,t){return n+Math.random()*(t-n)}function jm(n){return n*(.5-Math.random())}function Km(n){n!==void 0&&(Nc=n);let t=Nc+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function $m(n){return n*Wr}function Zm(n){return n*Qr}function Jm(n){return(n&n-1)===0&&n!==0}function Qm(n){return Math.pow(2,Math.ceil(Math.log(n)/Math.LN2))}function t_(n){return Math.pow(2,Math.floor(Math.log(n)/Math.LN2))}function e_(n,t,e,i,r){const s=Math.cos,o=Math.sin,a=s(e/2),l=o(e/2),c=s((t+i)/2),u=o((t+i)/2),h=s((t-i)/2),d=o((t-i)/2),p=s((i-t)/2),x=o((i-t)/2);switch(r){case"XYX":n.set(a*u,l*h,l*d,a*c);break;case"YZY":n.set(l*d,a*u,l*h,a*c);break;case"ZXZ":n.set(l*h,l*d,a*u,a*c);break;case"XZX":n.set(a*u,l*x,l*p,a*c);break;case"YXY":n.set(l*p,a*u,l*x,a*c);break;case"ZYZ":n.set(l*x,l*p,a*u,a*c);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+r)}}function er(n,t){switch(t.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("Invalid component type.")}}function Oe(n,t){switch(t.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("Invalid component type.")}}const n_={DEG2RAD:Wr,RAD2DEG:Qr,generateUUID:Er,clamp:jt,euclideanModulo:Gl,mapLinear:Hm,inverseLerp:Vm,lerp:Xr,damp:Gm,pingpong:km,smoothstep:Wm,smootherstep:Xm,randInt:qm,randFloat:Ym,randFloatSpread:jm,seededRandom:Km,degToRad:$m,radToDeg:Zm,isPowerOfTwo:Jm,ceilPowerOfTwo:Qm,floorPowerOfTwo:t_,setQuaternionFromProperEuler:e_,normalize:Oe,denormalize:er};class Yt{constructor(t=0,e=0){Yt.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,i=this.y,r=t.elements;return this.x=r[0]*e+r[3]*i+r[6],this.y=r[1]*e+r[4]*i+r[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=jt(this.x,t.x,e.x),this.y=jt(this.y,t.y,e.y),this}clampScalar(t,e){return this.x=jt(this.x,t,e),this.y=jt(this.y,t,e),this}clampLength(t,e){const i=this.length();return this.divideScalar(i||1).multiplyScalar(jt(i,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const i=this.dot(t)/e;return Math.acos(jt(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,i=this.y-t.y;return e*e+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const i=Math.cos(e),r=Math.sin(e),s=this.x-t.x,o=this.y-t.y;return this.x=s*i-o*r+t.x,this.y=s*r+o*i+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Gt{constructor(t,e,i,r,s,o,a,l,c){Gt.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,i,r,s,o,a,l,c)}set(t,e,i,r,s,o,a,l,c){const u=this.elements;return u[0]=t,u[1]=r,u[2]=a,u[3]=e,u[4]=s,u[5]=l,u[6]=i,u[7]=o,u[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,i=t.elements;return e[0]=i[0],e[1]=i[1],e[2]=i[2],e[3]=i[3],e[4]=i[4],e[5]=i[5],e[6]=i[6],e[7]=i[7],e[8]=i[8],this}extractBasis(t,e,i){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const i=t.elements,r=e.elements,s=this.elements,o=i[0],a=i[3],l=i[6],c=i[1],u=i[4],h=i[7],d=i[2],p=i[5],x=i[8],S=r[0],g=r[3],f=r[6],P=r[1],C=r[4],b=r[7],O=r[2],F=r[5],L=r[8];return s[0]=o*S+a*P+l*O,s[3]=o*g+a*C+l*F,s[6]=o*f+a*b+l*L,s[1]=c*S+u*P+h*O,s[4]=c*g+u*C+h*F,s[7]=c*f+u*b+h*L,s[2]=d*S+p*P+x*O,s[5]=d*g+p*C+x*F,s[8]=d*f+p*b+x*L,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],i=t[1],r=t[2],s=t[3],o=t[4],a=t[5],l=t[6],c=t[7],u=t[8];return e*o*u-e*a*c-i*s*u+i*a*l+r*s*c-r*o*l}invert(){const t=this.elements,e=t[0],i=t[1],r=t[2],s=t[3],o=t[4],a=t[5],l=t[6],c=t[7],u=t[8],h=u*o-a*c,d=a*l-u*s,p=c*s-o*l,x=e*h+i*d+r*p;if(x===0)return this.set(0,0,0,0,0,0,0,0,0);const S=1/x;return t[0]=h*S,t[1]=(r*c-u*i)*S,t[2]=(a*i-r*o)*S,t[3]=d*S,t[4]=(u*e-r*l)*S,t[5]=(r*s-a*e)*S,t[6]=p*S,t[7]=(i*l-c*e)*S,t[8]=(o*e-i*s)*S,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,i,r,s,o,a){const l=Math.cos(s),c=Math.sin(s);return this.set(i*l,i*c,-i*(l*o+c*a)+o+t,-r*c,r*l,-r*(-c*o+l*a)+a+e,0,0,1),this}scale(t,e){return this.premultiply(Fo.makeScale(t,e)),this}rotate(t){return this.premultiply(Fo.makeRotation(-t)),this}translate(t,e){return this.premultiply(Fo.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),i=Math.sin(t);return this.set(e,-i,0,i,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,i=t.elements;for(let r=0;r<9;r++)if(e[r]!==i[r])return!1;return!0}fromArray(t,e=0){for(let i=0;i<9;i++)this.elements[i]=t[i+e];return this}toArray(t=[],e=0){const i=this.elements;return t[e]=i[0],t[e+1]=i[1],t[e+2]=i[2],t[e+3]=i[3],t[e+4]=i[4],t[e+5]=i[5],t[e+6]=i[6],t[e+7]=i[7],t[e+8]=i[8],t}clone(){return new this.constructor().fromArray(this.elements)}}const Fo=new Gt;function qh(n){for(let t=n.length-1;t>=0;--t)if(n[t]>=65535)return!0;return!1}function no(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function i_(){const n=no("canvas");return n.style.display="block",n}const Fc={};function nr(n){n in Fc||(Fc[n]=!0,console.warn(n))}function r_(n,t,e){return new Promise(function(i,r){function s(){switch(n.clientWaitSync(t,n.SYNC_FLUSH_COMMANDS_BIT,0)){case n.WAIT_FAILED:r();break;case n.TIMEOUT_EXPIRED:setTimeout(s,e);break;default:i()}}setTimeout(s,e)})}function s_(n){const t=n.elements;t[2]=.5*t[2]+.5*t[3],t[6]=.5*t[6]+.5*t[7],t[10]=.5*t[10]+.5*t[11],t[14]=.5*t[14]+.5*t[15]}function o_(n){const t=n.elements;t[11]===-1?(t[10]=-t[10]-1,t[14]=-t[14]):(t[10]=-t[10],t[14]=-t[14]+1)}const Oc=new Gt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Bc=new Gt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function a_(){const n={enabled:!0,workingColorSpace:xr,spaces:{},convert:function(r,s,o){return this.enabled===!1||s===o||!s||!o||(this.spaces[s].transfer===oe&&(r.r=Wn(r.r),r.g=Wn(r.g),r.b=Wn(r.b)),this.spaces[s].primaries!==this.spaces[o].primaries&&(r.applyMatrix3(this.spaces[s].toXYZ),r.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===oe&&(r.r=hr(r.r),r.g=hr(r.g),r.b=hr(r.b))),r},fromWorkingColorSpace:function(r,s){return this.convert(r,this.workingColorSpace,s)},toWorkingColorSpace:function(r,s){return this.convert(r,s,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){return r===oi?to:this.spaces[r].transfer},getLuminanceCoefficients:function(r,s=this.workingColorSpace){return r.fromArray(this.spaces[s].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,s,o){return r.copy(this.spaces[s].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace}},t=[.64,.33,.3,.6,.15,.06],e=[.2126,.7152,.0722],i=[.3127,.329];return n.define({[xr]:{primaries:t,whitePoint:i,transfer:to,toXYZ:Oc,fromXYZ:Bc,luminanceCoefficients:e,workingColorSpaceConfig:{unpackColorSpace:on},outputColorSpaceConfig:{drawingBufferColorSpace:on}},[on]:{primaries:t,whitePoint:i,transfer:oe,toXYZ:Oc,fromXYZ:Bc,luminanceCoefficients:e,outputColorSpaceConfig:{drawingBufferColorSpace:on}}}),n}const Qt=a_();function Wn(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function hr(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}let Vi;class l_{static getDataURL(t){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let e;if(t instanceof HTMLCanvasElement)e=t;else{Vi===void 0&&(Vi=no("canvas")),Vi.width=t.width,Vi.height=t.height;const i=Vi.getContext("2d");t instanceof ImageData?i.putImageData(t,0,0):i.drawImage(t,0,0,t.width,t.height),e=Vi}return e.width>2048||e.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",t),e.toDataURL("image/jpeg",.6)):e.toDataURL("image/png")}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=no("canvas");e.width=t.width,e.height=t.height;const i=e.getContext("2d");i.drawImage(t,0,0,t.width,t.height);const r=i.getImageData(0,0,t.width,t.height),s=r.data;for(let o=0;o<s.length;o++)s[o]=Wn(s[o]/255)*255;return i.putImageData(r,0,0),e}else if(t.data){const e=t.data.slice(0);for(let i=0;i<e.length;i++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[i]=Math.floor(Wn(e[i]/255)*255):e[i]=Wn(e[i]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let c_=0;class Yh{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:c_++}),this.uuid=Er(),this.data=t,this.dataReady=!0,this.version=0}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const i={uuid:this.uuid,url:""},r=this.data;if(r!==null){let s;if(Array.isArray(r)){s=[];for(let o=0,a=r.length;o<a;o++)r[o].isDataTexture?s.push(Oo(r[o].image)):s.push(Oo(r[o]))}else s=Oo(r);i.url=s}return e||(t.images[this.uuid]=i),i}}function Oo(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?l_.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let u_=0;class Xe extends Oi{constructor(t=Xe.DEFAULT_IMAGE,e=Xe.DEFAULT_MAPPING,i=Ci,r=Ci,s=Tn,o=Pi,a=gn,l=Xn,c=Xe.DEFAULT_ANISOTROPY,u=oi){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:u_++}),this.uuid=Er(),this.name="",this.source=new Yh(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=i,this.wrapT=r,this.magFilter=s,this.minFilter=o,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=l,this.offset=new Yt(0,0),this.repeat=new Yt(1,1),this.center=new Yt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Gt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const i={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),e||(t.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==Uh)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case Ua:t.x=t.x-Math.floor(t.x);break;case Ci:t.x=t.x<0?0:1;break;case Na:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case Ua:t.y=t.y-Math.floor(t.y);break;case Ci:t.y=t.y<0?0:1;break;case Na:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}}Xe.DEFAULT_IMAGE=null;Xe.DEFAULT_MAPPING=Uh;Xe.DEFAULT_ANISOTROPY=1;class ve{constructor(t=0,e=0,i=0,r=1){ve.prototype.isVector4=!0,this.x=t,this.y=e,this.z=i,this.w=r}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,i,r){return this.x=t,this.y=e,this.z=i,this.w=r,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,i=this.y,r=this.z,s=this.w,o=t.elements;return this.x=o[0]*e+o[4]*i+o[8]*r+o[12]*s,this.y=o[1]*e+o[5]*i+o[9]*r+o[13]*s,this.z=o[2]*e+o[6]*i+o[10]*r+o[14]*s,this.w=o[3]*e+o[7]*i+o[11]*r+o[15]*s,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,i,r,s;const l=t.elements,c=l[0],u=l[4],h=l[8],d=l[1],p=l[5],x=l[9],S=l[2],g=l[6],f=l[10];if(Math.abs(u-d)<.01&&Math.abs(h-S)<.01&&Math.abs(x-g)<.01){if(Math.abs(u+d)<.1&&Math.abs(h+S)<.1&&Math.abs(x+g)<.1&&Math.abs(c+p+f-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const C=(c+1)/2,b=(p+1)/2,O=(f+1)/2,F=(u+d)/4,L=(h+S)/4,V=(x+g)/4;return C>b&&C>O?C<.01?(i=0,r=.707106781,s=.707106781):(i=Math.sqrt(C),r=F/i,s=L/i):b>O?b<.01?(i=.707106781,r=0,s=.707106781):(r=Math.sqrt(b),i=F/r,s=V/r):O<.01?(i=.707106781,r=.707106781,s=0):(s=Math.sqrt(O),i=L/s,r=V/s),this.set(i,r,s,e),this}let P=Math.sqrt((g-x)*(g-x)+(h-S)*(h-S)+(d-u)*(d-u));return Math.abs(P)<.001&&(P=1),this.x=(g-x)/P,this.y=(h-S)/P,this.z=(d-u)/P,this.w=Math.acos((c+p+f-1)/2),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=jt(this.x,t.x,e.x),this.y=jt(this.y,t.y,e.y),this.z=jt(this.z,t.z,e.z),this.w=jt(this.w,t.w,e.w),this}clampScalar(t,e){return this.x=jt(this.x,t,e),this.y=jt(this.y,t,e),this.z=jt(this.z,t,e),this.w=jt(this.w,t,e),this}clampLength(t,e){const i=this.length();return this.divideScalar(i||1).multiplyScalar(jt(i,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this.z=t.z+(e.z-t.z)*i,this.w=t.w+(e.w-t.w)*i,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class h_ extends Oi{constructor(t=1,e=1,i={}){super(),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=1,this.scissor=new ve(0,0,t,e),this.scissorTest=!1,this.viewport=new ve(0,0,t,e);const r={width:t,height:e,depth:1};i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Tn,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},i);const s=new Xe(r,i.mapping,i.wrapS,i.wrapT,i.magFilter,i.minFilter,i.format,i.type,i.anisotropy,i.colorSpace);s.flipY=!1,s.generateMipmaps=i.generateMipmaps,s.internalFormat=i.internalFormat,this.textures=[];const o=i.count;for(let a=0;a<o;a++)this.textures[a]=s.clone(),this.textures[a].isRenderTargetTexture=!0;this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this.depthTexture=i.depthTexture,this.samples=i.samples}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}setSize(t,e,i=1){if(this.width!==t||this.height!==e||this.depth!==i){this.width=t,this.height=e,this.depth=i;for(let r=0,s=this.textures.length;r<s;r++)this.textures[r].image.width=t,this.textures[r].image.height=e,this.textures[r].image.depth=i;this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let i=0,r=t.textures.length;i<r;i++)this.textures[i]=t.textures[i].clone(),this.textures[i].isRenderTargetTexture=!0;const e=Object.assign({},t.texture.image);return this.texture.source=new Yh(e),this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Ui extends h_{constructor(t=1,e=1,i={}){super(t,e,i),this.isWebGLRenderTarget=!0}}class jh extends Xe{constructor(t=null,e=1,i=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:i,depth:r},this.magFilter=xn,this.minFilter=xn,this.wrapR=Ci,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}}class f_ extends Xe{constructor(t=null,e=1,i=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:i,depth:r},this.magFilter=xn,this.minFilter=xn,this.wrapR=Ci,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Ni{constructor(t=0,e=0,i=0,r=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=i,this._w=r}static slerpFlat(t,e,i,r,s,o,a){let l=i[r+0],c=i[r+1],u=i[r+2],h=i[r+3];const d=s[o+0],p=s[o+1],x=s[o+2],S=s[o+3];if(a===0){t[e+0]=l,t[e+1]=c,t[e+2]=u,t[e+3]=h;return}if(a===1){t[e+0]=d,t[e+1]=p,t[e+2]=x,t[e+3]=S;return}if(h!==S||l!==d||c!==p||u!==x){let g=1-a;const f=l*d+c*p+u*x+h*S,P=f>=0?1:-1,C=1-f*f;if(C>Number.EPSILON){const O=Math.sqrt(C),F=Math.atan2(O,f*P);g=Math.sin(g*F)/O,a=Math.sin(a*F)/O}const b=a*P;if(l=l*g+d*b,c=c*g+p*b,u=u*g+x*b,h=h*g+S*b,g===1-a){const O=1/Math.sqrt(l*l+c*c+u*u+h*h);l*=O,c*=O,u*=O,h*=O}}t[e]=l,t[e+1]=c,t[e+2]=u,t[e+3]=h}static multiplyQuaternionsFlat(t,e,i,r,s,o){const a=i[r],l=i[r+1],c=i[r+2],u=i[r+3],h=s[o],d=s[o+1],p=s[o+2],x=s[o+3];return t[e]=a*x+u*h+l*p-c*d,t[e+1]=l*x+u*d+c*h-a*p,t[e+2]=c*x+u*p+a*d-l*h,t[e+3]=u*x-a*h-l*d-c*p,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,i,r){return this._x=t,this._y=e,this._z=i,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const i=t._x,r=t._y,s=t._z,o=t._order,a=Math.cos,l=Math.sin,c=a(i/2),u=a(r/2),h=a(s/2),d=l(i/2),p=l(r/2),x=l(s/2);switch(o){case"XYZ":this._x=d*u*h+c*p*x,this._y=c*p*h-d*u*x,this._z=c*u*x+d*p*h,this._w=c*u*h-d*p*x;break;case"YXZ":this._x=d*u*h+c*p*x,this._y=c*p*h-d*u*x,this._z=c*u*x-d*p*h,this._w=c*u*h+d*p*x;break;case"ZXY":this._x=d*u*h-c*p*x,this._y=c*p*h+d*u*x,this._z=c*u*x+d*p*h,this._w=c*u*h-d*p*x;break;case"ZYX":this._x=d*u*h-c*p*x,this._y=c*p*h+d*u*x,this._z=c*u*x-d*p*h,this._w=c*u*h+d*p*x;break;case"YZX":this._x=d*u*h+c*p*x,this._y=c*p*h+d*u*x,this._z=c*u*x-d*p*h,this._w=c*u*h-d*p*x;break;case"XZY":this._x=d*u*h-c*p*x,this._y=c*p*h-d*u*x,this._z=c*u*x+d*p*h,this._w=c*u*h+d*p*x;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const i=e/2,r=Math.sin(i);return this._x=t.x*r,this._y=t.y*r,this._z=t.z*r,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,i=e[0],r=e[4],s=e[8],o=e[1],a=e[5],l=e[9],c=e[2],u=e[6],h=e[10],d=i+a+h;if(d>0){const p=.5/Math.sqrt(d+1);this._w=.25/p,this._x=(u-l)*p,this._y=(s-c)*p,this._z=(o-r)*p}else if(i>a&&i>h){const p=2*Math.sqrt(1+i-a-h);this._w=(u-l)/p,this._x=.25*p,this._y=(r+o)/p,this._z=(s+c)/p}else if(a>h){const p=2*Math.sqrt(1+a-i-h);this._w=(s-c)/p,this._x=(r+o)/p,this._y=.25*p,this._z=(l+u)/p}else{const p=2*Math.sqrt(1+h-i-a);this._w=(o-r)/p,this._x=(s+c)/p,this._y=(l+u)/p,this._z=.25*p}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let i=t.dot(e)+1;return i<Number.EPSILON?(i=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=i):(this._x=0,this._y=-t.z,this._z=t.y,this._w=i)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=i),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(jt(this.dot(t),-1,1)))}rotateTowards(t,e){const i=this.angleTo(t);if(i===0)return this;const r=Math.min(1,e/i);return this.slerp(t,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const i=t._x,r=t._y,s=t._z,o=t._w,a=e._x,l=e._y,c=e._z,u=e._w;return this._x=i*u+o*a+r*c-s*l,this._y=r*u+o*l+s*a-i*c,this._z=s*u+o*c+i*l-r*a,this._w=o*u-i*a-r*l-s*c,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);const i=this._x,r=this._y,s=this._z,o=this._w;let a=o*t._w+i*t._x+r*t._y+s*t._z;if(a<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,a=-a):this.copy(t),a>=1)return this._w=o,this._x=i,this._y=r,this._z=s,this;const l=1-a*a;if(l<=Number.EPSILON){const p=1-e;return this._w=p*o+e*this._w,this._x=p*i+e*this._x,this._y=p*r+e*this._y,this._z=p*s+e*this._z,this.normalize(),this}const c=Math.sqrt(l),u=Math.atan2(c,a),h=Math.sin((1-e)*u)/c,d=Math.sin(e*u)/c;return this._w=o*h+this._w*d,this._x=i*h+this._x*d,this._y=r*h+this._y*d,this._z=s*h+this._z*d,this._onChangeCallback(),this}slerpQuaternions(t,e,i){return this.copy(t).slerp(e,i)}random(){const t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),i=Math.random(),r=Math.sqrt(1-i),s=Math.sqrt(i);return this.set(r*Math.sin(t),r*Math.cos(t),s*Math.sin(e),s*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class k{constructor(t=0,e=0,i=0){k.prototype.isVector3=!0,this.x=t,this.y=e,this.z=i}set(t,e,i){return i===void 0&&(i=this.z),this.x=t,this.y=e,this.z=i,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(zc.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(zc.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,i=this.y,r=this.z,s=t.elements;return this.x=s[0]*e+s[3]*i+s[6]*r,this.y=s[1]*e+s[4]*i+s[7]*r,this.z=s[2]*e+s[5]*i+s[8]*r,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,i=this.y,r=this.z,s=t.elements,o=1/(s[3]*e+s[7]*i+s[11]*r+s[15]);return this.x=(s[0]*e+s[4]*i+s[8]*r+s[12])*o,this.y=(s[1]*e+s[5]*i+s[9]*r+s[13])*o,this.z=(s[2]*e+s[6]*i+s[10]*r+s[14])*o,this}applyQuaternion(t){const e=this.x,i=this.y,r=this.z,s=t.x,o=t.y,a=t.z,l=t.w,c=2*(o*r-a*i),u=2*(a*e-s*r),h=2*(s*i-o*e);return this.x=e+l*c+o*h-a*u,this.y=i+l*u+a*c-s*h,this.z=r+l*h+s*u-o*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,i=this.y,r=this.z,s=t.elements;return this.x=s[0]*e+s[4]*i+s[8]*r,this.y=s[1]*e+s[5]*i+s[9]*r,this.z=s[2]*e+s[6]*i+s[10]*r,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=jt(this.x,t.x,e.x),this.y=jt(this.y,t.y,e.y),this.z=jt(this.z,t.z,e.z),this}clampScalar(t,e){return this.x=jt(this.x,t,e),this.y=jt(this.y,t,e),this.z=jt(this.z,t,e),this}clampLength(t,e){const i=this.length();return this.divideScalar(i||1).multiplyScalar(jt(i,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this.z=t.z+(e.z-t.z)*i,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const i=t.x,r=t.y,s=t.z,o=e.x,a=e.y,l=e.z;return this.x=r*l-s*a,this.y=s*o-i*l,this.z=i*a-r*o,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const i=t.dot(this)/e;return this.copy(t).multiplyScalar(i)}projectOnPlane(t){return Bo.copy(this).projectOnVector(t),this.sub(Bo)}reflect(t){return this.sub(Bo.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const i=this.dot(t)/e;return Math.acos(jt(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,i=this.y-t.y,r=this.z-t.z;return e*e+i*i+r*r}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,i){const r=Math.sin(e)*t;return this.x=r*Math.sin(i),this.y=Math.cos(e)*t,this.z=r*Math.cos(i),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,i){return this.x=t*Math.sin(e),this.y=i,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),i=this.setFromMatrixColumn(t,1).length(),r=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=i,this.z=r,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,e=Math.random()*2-1,i=Math.sqrt(1-e*e);return this.x=i*Math.cos(t),this.y=e,this.z=i*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const Bo=new k,zc=new Ni;class rs{constructor(t=new k(1/0,1/0,1/0),e=new k(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,i=t.length;e<i;e+=3)this.expandByPoint(hn.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,i=t.count;e<i;e++)this.expandByPoint(hn.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,i=t.length;e<i;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const i=hn.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(i),this.max.copy(t).add(i),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const i=t.geometry;if(i!==void 0){const s=i.getAttribute("position");if(e===!0&&s!==void 0&&t.isInstancedMesh!==!0)for(let o=0,a=s.count;o<a;o++)t.isMesh===!0?t.getVertexPosition(o,hn):hn.fromBufferAttribute(s,o),hn.applyMatrix4(t.matrixWorld),this.expandByPoint(hn);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),ds.copy(t.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),ds.copy(i.boundingBox)),ds.applyMatrix4(t.matrixWorld),this.union(ds)}const r=t.children;for(let s=0,o=r.length;s<o;s++)this.expandByObject(r[s],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,hn),hn.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,i;return t.normal.x>0?(e=t.normal.x*this.min.x,i=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,i=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,i+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,i+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,i+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,i+=t.normal.z*this.min.z),e<=-t.constant&&i>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(Rr),ps.subVectors(this.max,Rr),Gi.subVectors(t.a,Rr),ki.subVectors(t.b,Rr),Wi.subVectors(t.c,Rr),$n.subVectors(ki,Gi),Zn.subVectors(Wi,ki),xi.subVectors(Gi,Wi);let e=[0,-$n.z,$n.y,0,-Zn.z,Zn.y,0,-xi.z,xi.y,$n.z,0,-$n.x,Zn.z,0,-Zn.x,xi.z,0,-xi.x,-$n.y,$n.x,0,-Zn.y,Zn.x,0,-xi.y,xi.x,0];return!zo(e,Gi,ki,Wi,ps)||(e=[1,0,0,0,1,0,0,0,1],!zo(e,Gi,ki,Wi,ps))?!1:(ms.crossVectors($n,Zn),e=[ms.x,ms.y,ms.z],zo(e,Gi,ki,Wi,ps))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,hn).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(hn).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(Dn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),Dn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),Dn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),Dn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),Dn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),Dn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),Dn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),Dn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(Dn),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}}const Dn=[new k,new k,new k,new k,new k,new k,new k,new k],hn=new k,ds=new rs,Gi=new k,ki=new k,Wi=new k,$n=new k,Zn=new k,xi=new k,Rr=new k,ps=new k,ms=new k,Mi=new k;function zo(n,t,e,i,r){for(let s=0,o=n.length-3;s<=o;s+=3){Mi.fromArray(n,s);const a=r.x*Math.abs(Mi.x)+r.y*Math.abs(Mi.y)+r.z*Math.abs(Mi.z),l=t.dot(Mi),c=e.dot(Mi),u=i.dot(Mi);if(Math.max(-Math.max(l,c,u),Math.min(l,c,u))>a)return!1}return!0}const d_=new rs,Cr=new k,Ho=new k;class ss{constructor(t=new k,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const i=this.center;e!==void 0?i.copy(e):d_.setFromPoints(t).getCenter(i);let r=0;for(let s=0,o=t.length;s<o;s++)r=Math.max(r,i.distanceToSquared(t[s]));return this.radius=Math.sqrt(r),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const i=this.center.distanceToSquared(t);return e.copy(t),i>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;Cr.subVectors(t,this.center);const e=Cr.lengthSq();if(e>this.radius*this.radius){const i=Math.sqrt(e),r=(i-this.radius)*.5;this.center.addScaledVector(Cr,r/i),this.radius+=r}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(Ho.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(Cr.copy(t.center).add(Ho)),this.expandByPoint(Cr.copy(t.center).sub(Ho))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}}const Ln=new k,Vo=new k,_s=new k,Jn=new k,Go=new k,gs=new k,ko=new k;class _o{constructor(t=new k,e=new k(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,Ln)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);const i=e.dot(this.direction);return i<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const e=Ln.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(Ln.copy(this.origin).addScaledVector(this.direction,e),Ln.distanceToSquared(t))}distanceSqToSegment(t,e,i,r){Vo.copy(t).add(e).multiplyScalar(.5),_s.copy(e).sub(t).normalize(),Jn.copy(this.origin).sub(Vo);const s=t.distanceTo(e)*.5,o=-this.direction.dot(_s),a=Jn.dot(this.direction),l=-Jn.dot(_s),c=Jn.lengthSq(),u=Math.abs(1-o*o);let h,d,p,x;if(u>0)if(h=o*l-a,d=o*a-l,x=s*u,h>=0)if(d>=-x)if(d<=x){const S=1/u;h*=S,d*=S,p=h*(h+o*d+2*a)+d*(o*h+d+2*l)+c}else d=s,h=Math.max(0,-(o*d+a)),p=-h*h+d*(d+2*l)+c;else d=-s,h=Math.max(0,-(o*d+a)),p=-h*h+d*(d+2*l)+c;else d<=-x?(h=Math.max(0,-(-o*s+a)),d=h>0?-s:Math.min(Math.max(-s,-l),s),p=-h*h+d*(d+2*l)+c):d<=x?(h=0,d=Math.min(Math.max(-s,-l),s),p=d*(d+2*l)+c):(h=Math.max(0,-(o*s+a)),d=h>0?s:Math.min(Math.max(-s,-l),s),p=-h*h+d*(d+2*l)+c);else d=o>0?-s:s,h=Math.max(0,-(o*d+a)),p=-h*h+d*(d+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,h),r&&r.copy(Vo).addScaledVector(_s,d),p}intersectSphere(t,e){Ln.subVectors(t.center,this.origin);const i=Ln.dot(this.direction),r=Ln.dot(Ln)-i*i,s=t.radius*t.radius;if(r>s)return null;const o=Math.sqrt(s-r),a=i-o,l=i+o;return l<0?null:a<0?this.at(l,e):this.at(a,e)}intersectsSphere(t){return this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;const i=-(this.origin.dot(t.normal)+t.constant)/e;return i>=0?i:null}intersectPlane(t,e){const i=this.distanceToPlane(t);return i===null?null:this.at(i,e)}intersectsPlane(t){const e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let i,r,s,o,a,l;const c=1/this.direction.x,u=1/this.direction.y,h=1/this.direction.z,d=this.origin;return c>=0?(i=(t.min.x-d.x)*c,r=(t.max.x-d.x)*c):(i=(t.max.x-d.x)*c,r=(t.min.x-d.x)*c),u>=0?(s=(t.min.y-d.y)*u,o=(t.max.y-d.y)*u):(s=(t.max.y-d.y)*u,o=(t.min.y-d.y)*u),i>o||s>r||((s>i||isNaN(i))&&(i=s),(o<r||isNaN(r))&&(r=o),h>=0?(a=(t.min.z-d.z)*h,l=(t.max.z-d.z)*h):(a=(t.max.z-d.z)*h,l=(t.min.z-d.z)*h),i>l||a>r)||((a>i||i!==i)&&(i=a),(l<r||r!==r)&&(r=l),r<0)?null:this.at(i>=0?i:r,e)}intersectsBox(t){return this.intersectBox(t,Ln)!==null}intersectTriangle(t,e,i,r,s){Go.subVectors(e,t),gs.subVectors(i,t),ko.crossVectors(Go,gs);let o=this.direction.dot(ko),a;if(o>0){if(r)return null;a=1}else if(o<0)a=-1,o=-o;else return null;Jn.subVectors(this.origin,t);const l=a*this.direction.dot(gs.crossVectors(Jn,gs));if(l<0)return null;const c=a*this.direction.dot(Go.cross(Jn));if(c<0||l+c>o)return null;const u=-a*Jn.dot(ko);return u<0?null:this.at(u/o,s)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class ge{constructor(t,e,i,r,s,o,a,l,c,u,h,d,p,x,S,g){ge.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,i,r,s,o,a,l,c,u,h,d,p,x,S,g)}set(t,e,i,r,s,o,a,l,c,u,h,d,p,x,S,g){const f=this.elements;return f[0]=t,f[4]=e,f[8]=i,f[12]=r,f[1]=s,f[5]=o,f[9]=a,f[13]=l,f[2]=c,f[6]=u,f[10]=h,f[14]=d,f[3]=p,f[7]=x,f[11]=S,f[15]=g,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new ge().fromArray(this.elements)}copy(t){const e=this.elements,i=t.elements;return e[0]=i[0],e[1]=i[1],e[2]=i[2],e[3]=i[3],e[4]=i[4],e[5]=i[5],e[6]=i[6],e[7]=i[7],e[8]=i[8],e[9]=i[9],e[10]=i[10],e[11]=i[11],e[12]=i[12],e[13]=i[13],e[14]=i[14],e[15]=i[15],this}copyPosition(t){const e=this.elements,i=t.elements;return e[12]=i[12],e[13]=i[13],e[14]=i[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,i){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this}makeBasis(t,e,i){return this.set(t.x,e.x,i.x,0,t.y,e.y,i.y,0,t.z,e.z,i.z,0,0,0,0,1),this}extractRotation(t){const e=this.elements,i=t.elements,r=1/Xi.setFromMatrixColumn(t,0).length(),s=1/Xi.setFromMatrixColumn(t,1).length(),o=1/Xi.setFromMatrixColumn(t,2).length();return e[0]=i[0]*r,e[1]=i[1]*r,e[2]=i[2]*r,e[3]=0,e[4]=i[4]*s,e[5]=i[5]*s,e[6]=i[6]*s,e[7]=0,e[8]=i[8]*o,e[9]=i[9]*o,e[10]=i[10]*o,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,i=t.x,r=t.y,s=t.z,o=Math.cos(i),a=Math.sin(i),l=Math.cos(r),c=Math.sin(r),u=Math.cos(s),h=Math.sin(s);if(t.order==="XYZ"){const d=o*u,p=o*h,x=a*u,S=a*h;e[0]=l*u,e[4]=-l*h,e[8]=c,e[1]=p+x*c,e[5]=d-S*c,e[9]=-a*l,e[2]=S-d*c,e[6]=x+p*c,e[10]=o*l}else if(t.order==="YXZ"){const d=l*u,p=l*h,x=c*u,S=c*h;e[0]=d+S*a,e[4]=x*a-p,e[8]=o*c,e[1]=o*h,e[5]=o*u,e[9]=-a,e[2]=p*a-x,e[6]=S+d*a,e[10]=o*l}else if(t.order==="ZXY"){const d=l*u,p=l*h,x=c*u,S=c*h;e[0]=d-S*a,e[4]=-o*h,e[8]=x+p*a,e[1]=p+x*a,e[5]=o*u,e[9]=S-d*a,e[2]=-o*c,e[6]=a,e[10]=o*l}else if(t.order==="ZYX"){const d=o*u,p=o*h,x=a*u,S=a*h;e[0]=l*u,e[4]=x*c-p,e[8]=d*c+S,e[1]=l*h,e[5]=S*c+d,e[9]=p*c-x,e[2]=-c,e[6]=a*l,e[10]=o*l}else if(t.order==="YZX"){const d=o*l,p=o*c,x=a*l,S=a*c;e[0]=l*u,e[4]=S-d*h,e[8]=x*h+p,e[1]=h,e[5]=o*u,e[9]=-a*u,e[2]=-c*u,e[6]=p*h+x,e[10]=d-S*h}else if(t.order==="XZY"){const d=o*l,p=o*c,x=a*l,S=a*c;e[0]=l*u,e[4]=-h,e[8]=c*u,e[1]=d*h+S,e[5]=o*u,e[9]=p*h-x,e[2]=x*h-p,e[6]=a*u,e[10]=S*h+d}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(p_,t,m_)}lookAt(t,e,i){const r=this.elements;return Ye.subVectors(t,e),Ye.lengthSq()===0&&(Ye.z=1),Ye.normalize(),Qn.crossVectors(i,Ye),Qn.lengthSq()===0&&(Math.abs(i.z)===1?Ye.x+=1e-4:Ye.z+=1e-4,Ye.normalize(),Qn.crossVectors(i,Ye)),Qn.normalize(),vs.crossVectors(Ye,Qn),r[0]=Qn.x,r[4]=vs.x,r[8]=Ye.x,r[1]=Qn.y,r[5]=vs.y,r[9]=Ye.y,r[2]=Qn.z,r[6]=vs.z,r[10]=Ye.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const i=t.elements,r=e.elements,s=this.elements,o=i[0],a=i[4],l=i[8],c=i[12],u=i[1],h=i[5],d=i[9],p=i[13],x=i[2],S=i[6],g=i[10],f=i[14],P=i[3],C=i[7],b=i[11],O=i[15],F=r[0],L=r[4],V=r[8],w=r[12],T=r[1],U=r[5],rt=r[9],Z=r[13],ot=r[2],at=r[6],et=r[10],nt=r[14],G=r[3],mt=r[7],St=r[11],xt=r[15];return s[0]=o*F+a*T+l*ot+c*G,s[4]=o*L+a*U+l*at+c*mt,s[8]=o*V+a*rt+l*et+c*St,s[12]=o*w+a*Z+l*nt+c*xt,s[1]=u*F+h*T+d*ot+p*G,s[5]=u*L+h*U+d*at+p*mt,s[9]=u*V+h*rt+d*et+p*St,s[13]=u*w+h*Z+d*nt+p*xt,s[2]=x*F+S*T+g*ot+f*G,s[6]=x*L+S*U+g*at+f*mt,s[10]=x*V+S*rt+g*et+f*St,s[14]=x*w+S*Z+g*nt+f*xt,s[3]=P*F+C*T+b*ot+O*G,s[7]=P*L+C*U+b*at+O*mt,s[11]=P*V+C*rt+b*et+O*St,s[15]=P*w+C*Z+b*nt+O*xt,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],i=t[4],r=t[8],s=t[12],o=t[1],a=t[5],l=t[9],c=t[13],u=t[2],h=t[6],d=t[10],p=t[14],x=t[3],S=t[7],g=t[11],f=t[15];return x*(+s*l*h-r*c*h-s*a*d+i*c*d+r*a*p-i*l*p)+S*(+e*l*p-e*c*d+s*o*d-r*o*p+r*c*u-s*l*u)+g*(+e*c*h-e*a*p-s*o*h+i*o*p+s*a*u-i*c*u)+f*(-r*a*u-e*l*h+e*a*d+r*o*h-i*o*d+i*l*u)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,i){const r=this.elements;return t.isVector3?(r[12]=t.x,r[13]=t.y,r[14]=t.z):(r[12]=t,r[13]=e,r[14]=i),this}invert(){const t=this.elements,e=t[0],i=t[1],r=t[2],s=t[3],o=t[4],a=t[5],l=t[6],c=t[7],u=t[8],h=t[9],d=t[10],p=t[11],x=t[12],S=t[13],g=t[14],f=t[15],P=h*g*c-S*d*c+S*l*p-a*g*p-h*l*f+a*d*f,C=x*d*c-u*g*c-x*l*p+o*g*p+u*l*f-o*d*f,b=u*S*c-x*h*c+x*a*p-o*S*p-u*a*f+o*h*f,O=x*h*l-u*S*l-x*a*d+o*S*d+u*a*g-o*h*g,F=e*P+i*C+r*b+s*O;if(F===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const L=1/F;return t[0]=P*L,t[1]=(S*d*s-h*g*s-S*r*p+i*g*p+h*r*f-i*d*f)*L,t[2]=(a*g*s-S*l*s+S*r*c-i*g*c-a*r*f+i*l*f)*L,t[3]=(h*l*s-a*d*s-h*r*c+i*d*c+a*r*p-i*l*p)*L,t[4]=C*L,t[5]=(u*g*s-x*d*s+x*r*p-e*g*p-u*r*f+e*d*f)*L,t[6]=(x*l*s-o*g*s-x*r*c+e*g*c+o*r*f-e*l*f)*L,t[7]=(o*d*s-u*l*s+u*r*c-e*d*c-o*r*p+e*l*p)*L,t[8]=b*L,t[9]=(x*h*s-u*S*s-x*i*p+e*S*p+u*i*f-e*h*f)*L,t[10]=(o*S*s-x*a*s+x*i*c-e*S*c-o*i*f+e*a*f)*L,t[11]=(u*a*s-o*h*s-u*i*c+e*h*c+o*i*p-e*a*p)*L,t[12]=O*L,t[13]=(u*S*r-x*h*r+x*i*d-e*S*d-u*i*g+e*h*g)*L,t[14]=(x*a*r-o*S*r-x*i*l+e*S*l+o*i*g-e*a*g)*L,t[15]=(o*h*r-u*a*r+u*i*l-e*h*l-o*i*d+e*a*d)*L,this}scale(t){const e=this.elements,i=t.x,r=t.y,s=t.z;return e[0]*=i,e[4]*=r,e[8]*=s,e[1]*=i,e[5]*=r,e[9]*=s,e[2]*=i,e[6]*=r,e[10]*=s,e[3]*=i,e[7]*=r,e[11]*=s,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],i=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],r=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,i,r))}makeTranslation(t,e,i){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,i,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),i=Math.sin(t);return this.set(1,0,0,0,0,e,-i,0,0,i,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),i=Math.sin(t);return this.set(e,0,i,0,0,1,0,0,-i,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),i=Math.sin(t);return this.set(e,-i,0,0,i,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const i=Math.cos(e),r=Math.sin(e),s=1-i,o=t.x,a=t.y,l=t.z,c=s*o,u=s*a;return this.set(c*o+i,c*a-r*l,c*l+r*a,0,c*a+r*l,u*a+i,u*l-r*o,0,c*l-r*a,u*l+r*o,s*l*l+i,0,0,0,0,1),this}makeScale(t,e,i){return this.set(t,0,0,0,0,e,0,0,0,0,i,0,0,0,0,1),this}makeShear(t,e,i,r,s,o){return this.set(1,i,s,0,t,1,o,0,e,r,1,0,0,0,0,1),this}compose(t,e,i){const r=this.elements,s=e._x,o=e._y,a=e._z,l=e._w,c=s+s,u=o+o,h=a+a,d=s*c,p=s*u,x=s*h,S=o*u,g=o*h,f=a*h,P=l*c,C=l*u,b=l*h,O=i.x,F=i.y,L=i.z;return r[0]=(1-(S+f))*O,r[1]=(p+b)*O,r[2]=(x-C)*O,r[3]=0,r[4]=(p-b)*F,r[5]=(1-(d+f))*F,r[6]=(g+P)*F,r[7]=0,r[8]=(x+C)*L,r[9]=(g-P)*L,r[10]=(1-(d+S))*L,r[11]=0,r[12]=t.x,r[13]=t.y,r[14]=t.z,r[15]=1,this}decompose(t,e,i){const r=this.elements;let s=Xi.set(r[0],r[1],r[2]).length();const o=Xi.set(r[4],r[5],r[6]).length(),a=Xi.set(r[8],r[9],r[10]).length();this.determinant()<0&&(s=-s),t.x=r[12],t.y=r[13],t.z=r[14],fn.copy(this);const c=1/s,u=1/o,h=1/a;return fn.elements[0]*=c,fn.elements[1]*=c,fn.elements[2]*=c,fn.elements[4]*=u,fn.elements[5]*=u,fn.elements[6]*=u,fn.elements[8]*=h,fn.elements[9]*=h,fn.elements[10]*=h,e.setFromRotationMatrix(fn),i.x=s,i.y=o,i.z=a,this}makePerspective(t,e,i,r,s,o,a=Gn){const l=this.elements,c=2*s/(e-t),u=2*s/(i-r),h=(e+t)/(e-t),d=(i+r)/(i-r);let p,x;if(a===Gn)p=-(o+s)/(o-s),x=-2*o*s/(o-s);else if(a===eo)p=-o/(o-s),x=-o*s/(o-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return l[0]=c,l[4]=0,l[8]=h,l[12]=0,l[1]=0,l[5]=u,l[9]=d,l[13]=0,l[2]=0,l[6]=0,l[10]=p,l[14]=x,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,i,r,s,o,a=Gn){const l=this.elements,c=1/(e-t),u=1/(i-r),h=1/(o-s),d=(e+t)*c,p=(i+r)*u;let x,S;if(a===Gn)x=(o+s)*h,S=-2*h;else if(a===eo)x=s*h,S=-1*h;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-d,l[1]=0,l[5]=2*u,l[9]=0,l[13]=-p,l[2]=0,l[6]=0,l[10]=S,l[14]=-x,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){const e=this.elements,i=t.elements;for(let r=0;r<16;r++)if(e[r]!==i[r])return!1;return!0}fromArray(t,e=0){for(let i=0;i<16;i++)this.elements[i]=t[i+e];return this}toArray(t=[],e=0){const i=this.elements;return t[e]=i[0],t[e+1]=i[1],t[e+2]=i[2],t[e+3]=i[3],t[e+4]=i[4],t[e+5]=i[5],t[e+6]=i[6],t[e+7]=i[7],t[e+8]=i[8],t[e+9]=i[9],t[e+10]=i[10],t[e+11]=i[11],t[e+12]=i[12],t[e+13]=i[13],t[e+14]=i[14],t[e+15]=i[15],t}}const Xi=new k,fn=new ge,p_=new k(0,0,0),m_=new k(1,1,1),Qn=new k,vs=new k,Ye=new k,Hc=new ge,Vc=new Ni;class qn{constructor(t=0,e=0,i=0,r=qn.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=i,this._order=r}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,i,r=this._order){return this._x=t,this._y=e,this._z=i,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,i=!0){const r=t.elements,s=r[0],o=r[4],a=r[8],l=r[1],c=r[5],u=r[9],h=r[2],d=r[6],p=r[10];switch(e){case"XYZ":this._y=Math.asin(jt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-u,p),this._z=Math.atan2(-o,s)):(this._x=Math.atan2(d,c),this._z=0);break;case"YXZ":this._x=Math.asin(-jt(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(a,p),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-h,s),this._z=0);break;case"ZXY":this._x=Math.asin(jt(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-h,p),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(l,s));break;case"ZYX":this._y=Math.asin(-jt(h,-1,1)),Math.abs(h)<.9999999?(this._x=Math.atan2(d,p),this._z=Math.atan2(l,s)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin(jt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-u,c),this._y=Math.atan2(-h,s)):(this._x=0,this._y=Math.atan2(a,p));break;case"XZY":this._z=Math.asin(-jt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(a,s)):(this._x=Math.atan2(-u,p),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,i===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,i){return Hc.makeRotationFromQuaternion(t),this.setFromRotationMatrix(Hc,e,i)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return Vc.setFromEuler(this),this.setFromQuaternion(Vc,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}qn.DEFAULT_ORDER="XYZ";class Kh{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let __=0;const Gc=new k,qi=new Ni,In=new ge,xs=new k,Pr=new k,g_=new k,v_=new Ni,kc=new k(1,0,0),Wc=new k(0,1,0),Xc=new k(0,0,1),qc={type:"added"},x_={type:"removed"},Yi={type:"childadded",child:null},Wo={type:"childremoved",child:null};class Ve extends Oi{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:__++}),this.uuid=Er(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Ve.DEFAULT_UP.clone();const t=new k,e=new qn,i=new Ni,r=new k(1,1,1);function s(){i.setFromEuler(e,!1)}function o(){e.setFromQuaternion(i,void 0,!1)}e._onChange(s),i._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new ge},normalMatrix:{value:new Gt}}),this.matrix=new ge,this.matrixWorld=new ge,this.matrixAutoUpdate=Ve.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Ve.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Kh,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return qi.setFromAxisAngle(t,e),this.quaternion.multiply(qi),this}rotateOnWorldAxis(t,e){return qi.setFromAxisAngle(t,e),this.quaternion.premultiply(qi),this}rotateX(t){return this.rotateOnAxis(kc,t)}rotateY(t){return this.rotateOnAxis(Wc,t)}rotateZ(t){return this.rotateOnAxis(Xc,t)}translateOnAxis(t,e){return Gc.copy(t).applyQuaternion(this.quaternion),this.position.add(Gc.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(kc,t)}translateY(t){return this.translateOnAxis(Wc,t)}translateZ(t){return this.translateOnAxis(Xc,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(In.copy(this.matrixWorld).invert())}lookAt(t,e,i){t.isVector3?xs.copy(t):xs.set(t,e,i);const r=this.parent;this.updateWorldMatrix(!0,!1),Pr.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?In.lookAt(Pr,xs,this.up):In.lookAt(xs,Pr,this.up),this.quaternion.setFromRotationMatrix(In),r&&(In.extractRotation(r.matrixWorld),qi.setFromRotationMatrix(In),this.quaternion.premultiply(qi.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(qc),Yi.child=t,this.dispatchEvent(Yi),Yi.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(x_),Wo.child=t,this.dispatchEvent(Wo),Wo.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),In.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),In.multiply(t.parent.matrixWorld)),t.applyMatrix4(In),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(qc),Yi.child=t,this.dispatchEvent(Yi),Yi.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let i=0,r=this.children.length;i<r;i++){const o=this.children[i].getObjectByProperty(t,e);if(o!==void 0)return o}}getObjectsByProperty(t,e,i=[]){this[t]===e&&i.push(this);const r=this.children;for(let s=0,o=r.length;s<o;s++)r[s].getObjectsByProperty(t,e,i);return i}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Pr,t,g_),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Pr,v_,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);const e=this.children;for(let i=0,r=e.length;i<r;i++)e[i].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const e=this.children;for(let i=0,r=e.length;i<r;i++)e[i].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);const e=this.children;for(let i=0,r=e.length;i<r;i++)e[i].updateMatrixWorld(t)}updateWorldMatrix(t,e){const i=this.parent;if(t===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),e===!0){const r=this.children;for(let s=0,o=r.length;s<o;s++)r[s].updateWorldMatrix(!1,!0)}}toJSON(t){const e=t===void 0||typeof t=="string",i={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const r={};r.uuid=this.uuid,r.type=this.type,this.name!==""&&(r.name=this.name),this.castShadow===!0&&(r.castShadow=!0),this.receiveShadow===!0&&(r.receiveShadow=!0),this.visible===!1&&(r.visible=!1),this.frustumCulled===!1&&(r.frustumCulled=!1),this.renderOrder!==0&&(r.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(r.matrixAutoUpdate=!1),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.visibility=this._visibility,r.active=this._active,r.bounds=this._bounds.map(a=>({boxInitialized:a.boxInitialized,boxMin:a.box.min.toArray(),boxMax:a.box.max.toArray(),sphereInitialized:a.sphereInitialized,sphereRadius:a.sphere.radius,sphereCenter:a.sphere.center.toArray()})),r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.geometryCount=this._geometryCount,r.matricesTexture=this._matricesTexture.toJSON(t),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(r.boundingSphere={center:r.boundingSphere.center.toArray(),radius:r.boundingSphere.radius}),this.boundingBox!==null&&(r.boundingBox={min:r.boundingBox.min.toArray(),max:r.boundingBox.max.toArray()}));function s(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=s(t.geometries,this.geometry);const a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){const l=a.shapes;if(Array.isArray(l))for(let c=0,u=l.length;c<u;c++){const h=l[c];s(t.shapes,h)}else s(t.shapes,l)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(t.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const a=[];for(let l=0,c=this.material.length;l<c;l++)a.push(s(t.materials,this.material[l]));r.material=a}else r.material=s(t.materials,this.material);if(this.children.length>0){r.children=[];for(let a=0;a<this.children.length;a++)r.children.push(this.children[a].toJSON(t).object)}if(this.animations.length>0){r.animations=[];for(let a=0;a<this.animations.length;a++){const l=this.animations[a];r.animations.push(s(t.animations,l))}}if(e){const a=o(t.geometries),l=o(t.materials),c=o(t.textures),u=o(t.images),h=o(t.shapes),d=o(t.skeletons),p=o(t.animations),x=o(t.nodes);a.length>0&&(i.geometries=a),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),u.length>0&&(i.images=u),h.length>0&&(i.shapes=h),d.length>0&&(i.skeletons=d),p.length>0&&(i.animations=p),x.length>0&&(i.nodes=x)}return i.object=r,i;function o(a){const l=[];for(const c in a){const u=a[c];delete u.metadata,l.push(u)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let i=0;i<t.children.length;i++){const r=t.children[i];this.add(r.clone())}return this}}Ve.DEFAULT_UP=new k(0,1,0);Ve.DEFAULT_MATRIX_AUTO_UPDATE=!0;Ve.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const dn=new k,Un=new k,Xo=new k,Nn=new k,ji=new k,Ki=new k,Yc=new k,qo=new k,Yo=new k,jo=new k,Ko=new ve,$o=new ve,Zo=new ve;class mn{constructor(t=new k,e=new k,i=new k){this.a=t,this.b=e,this.c=i}static getNormal(t,e,i,r){r.subVectors(i,e),dn.subVectors(t,e),r.cross(dn);const s=r.lengthSq();return s>0?r.multiplyScalar(1/Math.sqrt(s)):r.set(0,0,0)}static getBarycoord(t,e,i,r,s){dn.subVectors(r,e),Un.subVectors(i,e),Xo.subVectors(t,e);const o=dn.dot(dn),a=dn.dot(Un),l=dn.dot(Xo),c=Un.dot(Un),u=Un.dot(Xo),h=o*c-a*a;if(h===0)return s.set(0,0,0),null;const d=1/h,p=(c*l-a*u)*d,x=(o*u-a*l)*d;return s.set(1-p-x,x,p)}static containsPoint(t,e,i,r){return this.getBarycoord(t,e,i,r,Nn)===null?!1:Nn.x>=0&&Nn.y>=0&&Nn.x+Nn.y<=1}static getInterpolation(t,e,i,r,s,o,a,l){return this.getBarycoord(t,e,i,r,Nn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(s,Nn.x),l.addScaledVector(o,Nn.y),l.addScaledVector(a,Nn.z),l)}static getInterpolatedAttribute(t,e,i,r,s,o){return Ko.setScalar(0),$o.setScalar(0),Zo.setScalar(0),Ko.fromBufferAttribute(t,e),$o.fromBufferAttribute(t,i),Zo.fromBufferAttribute(t,r),o.setScalar(0),o.addScaledVector(Ko,s.x),o.addScaledVector($o,s.y),o.addScaledVector(Zo,s.z),o}static isFrontFacing(t,e,i,r){return dn.subVectors(i,e),Un.subVectors(t,e),dn.cross(Un).dot(r)<0}set(t,e,i){return this.a.copy(t),this.b.copy(e),this.c.copy(i),this}setFromPointsAndIndices(t,e,i,r){return this.a.copy(t[e]),this.b.copy(t[i]),this.c.copy(t[r]),this}setFromAttributeAndIndices(t,e,i,r){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,i),this.c.fromBufferAttribute(t,r),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return dn.subVectors(this.c,this.b),Un.subVectors(this.a,this.b),dn.cross(Un).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return mn.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return mn.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,i,r,s){return mn.getInterpolation(t,this.a,this.b,this.c,e,i,r,s)}containsPoint(t){return mn.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return mn.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){const i=this.a,r=this.b,s=this.c;let o,a;ji.subVectors(r,i),Ki.subVectors(s,i),qo.subVectors(t,i);const l=ji.dot(qo),c=Ki.dot(qo);if(l<=0&&c<=0)return e.copy(i);Yo.subVectors(t,r);const u=ji.dot(Yo),h=Ki.dot(Yo);if(u>=0&&h<=u)return e.copy(r);const d=l*h-u*c;if(d<=0&&l>=0&&u<=0)return o=l/(l-u),e.copy(i).addScaledVector(ji,o);jo.subVectors(t,s);const p=ji.dot(jo),x=Ki.dot(jo);if(x>=0&&p<=x)return e.copy(s);const S=p*c-l*x;if(S<=0&&c>=0&&x<=0)return a=c/(c-x),e.copy(i).addScaledVector(Ki,a);const g=u*x-p*h;if(g<=0&&h-u>=0&&p-x>=0)return Yc.subVectors(s,r),a=(h-u)/(h-u+(p-x)),e.copy(r).addScaledVector(Yc,a);const f=1/(g+S+d);return o=S*f,a=d*f,e.copy(i).addScaledVector(ji,o).addScaledVector(Ki,a)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}const $h={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},ti={h:0,s:0,l:0},Ms={h:0,s:0,l:0};function Jo(n,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?n+(t-n)*6*e:e<1/2?t:e<2/3?n+(t-n)*6*(2/3-e):n}class ee{constructor(t,e,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,i)}set(t,e,i){if(e===void 0&&i===void 0){const r=t;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(t,e,i);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=on){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,Qt.toWorkingColorSpace(this,e),this}setRGB(t,e,i,r=Qt.workingColorSpace){return this.r=t,this.g=e,this.b=i,Qt.toWorkingColorSpace(this,r),this}setHSL(t,e,i,r=Qt.workingColorSpace){if(t=Gl(t,1),e=jt(e,0,1),i=jt(i,0,1),e===0)this.r=this.g=this.b=i;else{const s=i<=.5?i*(1+e):i+e-i*e,o=2*i-s;this.r=Jo(o,s,t+1/3),this.g=Jo(o,s,t),this.b=Jo(o,s,t-1/3)}return Qt.toWorkingColorSpace(this,r),this}setStyle(t,e=on){function i(s){s!==void 0&&parseFloat(s)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(t)){let s;const o=r[1],a=r[2];switch(o){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,e);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,e);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(t)){const s=r[1],o=s.length;if(o===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,e);if(o===6)return this.setHex(parseInt(s,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=on){const i=$h[t.toLowerCase()];return i!==void 0?this.setHex(i,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=Wn(t.r),this.g=Wn(t.g),this.b=Wn(t.b),this}copyLinearToSRGB(t){return this.r=hr(t.r),this.g=hr(t.g),this.b=hr(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=on){return Qt.fromWorkingColorSpace(Le.copy(this),t),Math.round(jt(Le.r*255,0,255))*65536+Math.round(jt(Le.g*255,0,255))*256+Math.round(jt(Le.b*255,0,255))}getHexString(t=on){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=Qt.workingColorSpace){Qt.fromWorkingColorSpace(Le.copy(this),e);const i=Le.r,r=Le.g,s=Le.b,o=Math.max(i,r,s),a=Math.min(i,r,s);let l,c;const u=(a+o)/2;if(a===o)l=0,c=0;else{const h=o-a;switch(c=u<=.5?h/(o+a):h/(2-o-a),o){case i:l=(r-s)/h+(r<s?6:0);break;case r:l=(s-i)/h+2;break;case s:l=(i-r)/h+4;break}l/=6}return t.h=l,t.s=c,t.l=u,t}getRGB(t,e=Qt.workingColorSpace){return Qt.fromWorkingColorSpace(Le.copy(this),e),t.r=Le.r,t.g=Le.g,t.b=Le.b,t}getStyle(t=on){Qt.fromWorkingColorSpace(Le.copy(this),t);const e=Le.r,i=Le.g,r=Le.b;return t!==on?`color(${t} ${e.toFixed(3)} ${i.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(i*255)},${Math.round(r*255)})`}offsetHSL(t,e,i){return this.getHSL(ti),this.setHSL(ti.h+t,ti.s+e,ti.l+i)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,i){return this.r=t.r+(e.r-t.r)*i,this.g=t.g+(e.g-t.g)*i,this.b=t.b+(e.b-t.b)*i,this}lerpHSL(t,e){this.getHSL(ti),t.getHSL(Ms);const i=Xr(ti.h,Ms.h,e),r=Xr(ti.s,Ms.s,e),s=Xr(ti.l,Ms.l,e);return this.setHSL(i,r,s),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,i=this.g,r=this.b,s=t.elements;return this.r=s[0]*e+s[3]*i+s[6]*r,this.g=s[1]*e+s[4]*i+s[7]*r,this.b=s[2]*e+s[5]*i+s[8]*r,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Le=new ee;ee.NAMES=$h;let M_=0;class yr extends Oi{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:M_++}),this.uuid=Er(),this.name="",this.type="Material",this.blending=cr,this.side=fi,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=ya,this.blendDst=Ta,this.blendEquation=wi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new ee(0,0,0),this.blendAlpha=0,this.depthFunc=pr,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Lc,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Hi,this.stencilZFail=Hi,this.stencilZPass=Hi,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const e in t){const i=t[e];if(i===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}const r=this[e];if(r===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(i):r&&r.isVector3&&i&&i.isVector3?r.copy(i):this[e]=i}}toJSON(t){const e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});const i={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(t).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(t).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(t).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(t).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(t).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==cr&&(i.blending=this.blending),this.side!==fi&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==ya&&(i.blendSrc=this.blendSrc),this.blendDst!==Ta&&(i.blendDst=this.blendDst),this.blendEquation!==wi&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==pr&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Lc&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Hi&&(i.stencilFail=this.stencilFail),this.stencilZFail!==Hi&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==Hi&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function r(s){const o=[];for(const a in s){const l=s[a];delete l.metadata,o.push(l)}return o}if(e){const s=r(t.textures),o=r(t.images);s.length>0&&(i.textures=s),o.length>0&&(i.images=o)}return i}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const e=t.clippingPlanes;let i=null;if(e!==null){const r=e.length;i=new Array(r);for(let s=0;s!==r;++s)i[s]=e[s].clone()}return this.clippingPlanes=i,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}}class Zh extends yr{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new ee(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new qn,this.combine=Ih,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const Me=new k,Ss=new Yt;class wn{constructor(t,e,i=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=i,this.usage=Ic,this.updateRanges=[],this.gpuType=Vn,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,i){t*=this.itemSize,i*=e.itemSize;for(let r=0,s=this.itemSize;r<s;r++)this.array[t+r]=e.array[i+r];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,i=this.count;e<i;e++)Ss.fromBufferAttribute(this,e),Ss.applyMatrix3(t),this.setXY(e,Ss.x,Ss.y);else if(this.itemSize===3)for(let e=0,i=this.count;e<i;e++)Me.fromBufferAttribute(this,e),Me.applyMatrix3(t),this.setXYZ(e,Me.x,Me.y,Me.z);return this}applyMatrix4(t){for(let e=0,i=this.count;e<i;e++)Me.fromBufferAttribute(this,e),Me.applyMatrix4(t),this.setXYZ(e,Me.x,Me.y,Me.z);return this}applyNormalMatrix(t){for(let e=0,i=this.count;e<i;e++)Me.fromBufferAttribute(this,e),Me.applyNormalMatrix(t),this.setXYZ(e,Me.x,Me.y,Me.z);return this}transformDirection(t){for(let e=0,i=this.count;e<i;e++)Me.fromBufferAttribute(this,e),Me.transformDirection(t),this.setXYZ(e,Me.x,Me.y,Me.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let i=this.array[t*this.itemSize+e];return this.normalized&&(i=er(i,this.array)),i}setComponent(t,e,i){return this.normalized&&(i=Oe(i,this.array)),this.array[t*this.itemSize+e]=i,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=er(e,this.array)),e}setX(t,e){return this.normalized&&(e=Oe(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=er(e,this.array)),e}setY(t,e){return this.normalized&&(e=Oe(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=er(e,this.array)),e}setZ(t,e){return this.normalized&&(e=Oe(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=er(e,this.array)),e}setW(t,e){return this.normalized&&(e=Oe(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,i){return t*=this.itemSize,this.normalized&&(e=Oe(e,this.array),i=Oe(i,this.array)),this.array[t+0]=e,this.array[t+1]=i,this}setXYZ(t,e,i,r){return t*=this.itemSize,this.normalized&&(e=Oe(e,this.array),i=Oe(i,this.array),r=Oe(r,this.array)),this.array[t+0]=e,this.array[t+1]=i,this.array[t+2]=r,this}setXYZW(t,e,i,r,s){return t*=this.itemSize,this.normalized&&(e=Oe(e,this.array),i=Oe(i,this.array),r=Oe(r,this.array),s=Oe(s,this.array)),this.array[t+0]=e,this.array[t+1]=i,this.array[t+2]=r,this.array[t+3]=s,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==Ic&&(t.usage=this.usage),t}}class Jh extends wn{constructor(t,e,i){super(new Uint16Array(t),e,i)}}class Qh extends wn{constructor(t,e,i){super(new Uint32Array(t),e,i)}}class Je extends wn{constructor(t,e,i){super(new Float32Array(t),e,i)}}let S_=0;const rn=new ge,Qo=new Ve,$i=new k,je=new rs,Dr=new rs,Ae=new k;class tn extends Oi{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:S_++}),this.uuid=Er(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(qh(t)?Qh:Jh)(t,1):this.index=t,this}setIndirect(t){return this.indirect=t,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,i=0){this.groups.push({start:t,count:e,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){const e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);const i=this.attributes.normal;if(i!==void 0){const s=new Gt().getNormalMatrix(t);i.applyNormalMatrix(s),i.needsUpdate=!0}const r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(t),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return rn.makeRotationFromQuaternion(t),this.applyMatrix4(rn),this}rotateX(t){return rn.makeRotationX(t),this.applyMatrix4(rn),this}rotateY(t){return rn.makeRotationY(t),this.applyMatrix4(rn),this}rotateZ(t){return rn.makeRotationZ(t),this.applyMatrix4(rn),this}translate(t,e,i){return rn.makeTranslation(t,e,i),this.applyMatrix4(rn),this}scale(t,e,i){return rn.makeScale(t,e,i),this.applyMatrix4(rn),this}lookAt(t){return Qo.lookAt(t),Qo.updateMatrix(),this.applyMatrix4(Qo.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter($i).negate(),this.translate($i.x,$i.y,$i.z),this}setFromPoints(t){const e=this.getAttribute("position");if(e===void 0){const i=[];for(let r=0,s=t.length;r<s;r++){const o=t[r];i.push(o.x,o.y,o.z||0)}this.setAttribute("position",new Je(i,3))}else{const i=Math.min(t.length,e.count);for(let r=0;r<i;r++){const s=t[r];e.setXYZ(r,s.x,s.y,s.z||0)}t.length>e.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new rs);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new k(-1/0,-1/0,-1/0),new k(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let i=0,r=e.length;i<r;i++){const s=e[i];je.setFromBufferAttribute(s),this.morphTargetsRelative?(Ae.addVectors(this.boundingBox.min,je.min),this.boundingBox.expandByPoint(Ae),Ae.addVectors(this.boundingBox.max,je.max),this.boundingBox.expandByPoint(Ae)):(this.boundingBox.expandByPoint(je.min),this.boundingBox.expandByPoint(je.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new ss);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new k,1/0);return}if(t){const i=this.boundingSphere.center;if(je.setFromBufferAttribute(t),e)for(let s=0,o=e.length;s<o;s++){const a=e[s];Dr.setFromBufferAttribute(a),this.morphTargetsRelative?(Ae.addVectors(je.min,Dr.min),je.expandByPoint(Ae),Ae.addVectors(je.max,Dr.max),je.expandByPoint(Ae)):(je.expandByPoint(Dr.min),je.expandByPoint(Dr.max))}je.getCenter(i);let r=0;for(let s=0,o=t.count;s<o;s++)Ae.fromBufferAttribute(t,s),r=Math.max(r,i.distanceToSquared(Ae));if(e)for(let s=0,o=e.length;s<o;s++){const a=e[s],l=this.morphTargetsRelative;for(let c=0,u=a.count;c<u;c++)Ae.fromBufferAttribute(a,c),l&&($i.fromBufferAttribute(t,c),Ae.add($i)),r=Math.max(r,i.distanceToSquared(Ae))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const i=e.position,r=e.normal,s=e.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new wn(new Float32Array(4*i.count),4));const o=this.getAttribute("tangent"),a=[],l=[];for(let V=0;V<i.count;V++)a[V]=new k,l[V]=new k;const c=new k,u=new k,h=new k,d=new Yt,p=new Yt,x=new Yt,S=new k,g=new k;function f(V,w,T){c.fromBufferAttribute(i,V),u.fromBufferAttribute(i,w),h.fromBufferAttribute(i,T),d.fromBufferAttribute(s,V),p.fromBufferAttribute(s,w),x.fromBufferAttribute(s,T),u.sub(c),h.sub(c),p.sub(d),x.sub(d);const U=1/(p.x*x.y-x.x*p.y);isFinite(U)&&(S.copy(u).multiplyScalar(x.y).addScaledVector(h,-p.y).multiplyScalar(U),g.copy(h).multiplyScalar(p.x).addScaledVector(u,-x.x).multiplyScalar(U),a[V].add(S),a[w].add(S),a[T].add(S),l[V].add(g),l[w].add(g),l[T].add(g))}let P=this.groups;P.length===0&&(P=[{start:0,count:t.count}]);for(let V=0,w=P.length;V<w;++V){const T=P[V],U=T.start,rt=T.count;for(let Z=U,ot=U+rt;Z<ot;Z+=3)f(t.getX(Z+0),t.getX(Z+1),t.getX(Z+2))}const C=new k,b=new k,O=new k,F=new k;function L(V){O.fromBufferAttribute(r,V),F.copy(O);const w=a[V];C.copy(w),C.sub(O.multiplyScalar(O.dot(w))).normalize(),b.crossVectors(F,w);const U=b.dot(l[V])<0?-1:1;o.setXYZW(V,C.x,C.y,C.z,U)}for(let V=0,w=P.length;V<w;++V){const T=P[V],U=T.start,rt=T.count;for(let Z=U,ot=U+rt;Z<ot;Z+=3)L(t.getX(Z+0)),L(t.getX(Z+1)),L(t.getX(Z+2))}}computeVertexNormals(){const t=this.index,e=this.getAttribute("position");if(e!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new wn(new Float32Array(e.count*3),3),this.setAttribute("normal",i);else for(let d=0,p=i.count;d<p;d++)i.setXYZ(d,0,0,0);const r=new k,s=new k,o=new k,a=new k,l=new k,c=new k,u=new k,h=new k;if(t)for(let d=0,p=t.count;d<p;d+=3){const x=t.getX(d+0),S=t.getX(d+1),g=t.getX(d+2);r.fromBufferAttribute(e,x),s.fromBufferAttribute(e,S),o.fromBufferAttribute(e,g),u.subVectors(o,s),h.subVectors(r,s),u.cross(h),a.fromBufferAttribute(i,x),l.fromBufferAttribute(i,S),c.fromBufferAttribute(i,g),a.add(u),l.add(u),c.add(u),i.setXYZ(x,a.x,a.y,a.z),i.setXYZ(S,l.x,l.y,l.z),i.setXYZ(g,c.x,c.y,c.z)}else for(let d=0,p=e.count;d<p;d+=3)r.fromBufferAttribute(e,d+0),s.fromBufferAttribute(e,d+1),o.fromBufferAttribute(e,d+2),u.subVectors(o,s),h.subVectors(r,s),u.cross(h),i.setXYZ(d+0,u.x,u.y,u.z),i.setXYZ(d+1,u.x,u.y,u.z),i.setXYZ(d+2,u.x,u.y,u.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let e=0,i=t.count;e<i;e++)Ae.fromBufferAttribute(t,e),Ae.normalize(),t.setXYZ(e,Ae.x,Ae.y,Ae.z)}toNonIndexed(){function t(a,l){const c=a.array,u=a.itemSize,h=a.normalized,d=new c.constructor(l.length*u);let p=0,x=0;for(let S=0,g=l.length;S<g;S++){a.isInterleavedBufferAttribute?p=l[S]*a.data.stride+a.offset:p=l[S]*u;for(let f=0;f<u;f++)d[x++]=c[p++]}return new wn(d,u,h)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const e=new tn,i=this.index.array,r=this.attributes;for(const a in r){const l=r[a],c=t(l,i);e.setAttribute(a,c)}const s=this.morphAttributes;for(const a in s){const l=[],c=s[a];for(let u=0,h=c.length;u<h;u++){const d=c[u],p=t(d,i);l.push(p)}e.morphAttributes[a]=l}e.morphTargetsRelative=this.morphTargetsRelative;const o=this.groups;for(let a=0,l=o.length;a<l;a++){const c=o[a];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){const t={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};const e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});const i=this.attributes;for(const l in i){const c=i[l];t.data.attributes[l]=c.toJSON(t.data)}const r={};let s=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],u=[];for(let h=0,d=c.length;h<d;h++){const p=c[h];u.push(p.toJSON(t.data))}u.length>0&&(r[l]=u,s=!0)}s&&(t.data.morphAttributes=r,t.data.morphTargetsRelative=this.morphTargetsRelative);const o=this.groups;o.length>0&&(t.data.groups=JSON.parse(JSON.stringify(o)));const a=this.boundingSphere;return a!==null&&(t.data.boundingSphere={center:a.center.toArray(),radius:a.radius}),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const e={};this.name=t.name;const i=t.index;i!==null&&this.setIndex(i.clone(e));const r=t.attributes;for(const c in r){const u=r[c];this.setAttribute(c,u.clone(e))}const s=t.morphAttributes;for(const c in s){const u=[],h=s[c];for(let d=0,p=h.length;d<p;d++)u.push(h[d].clone(e));this.morphAttributes[c]=u}this.morphTargetsRelative=t.morphTargetsRelative;const o=t.groups;for(let c=0,u=o.length;c<u;c++){const h=o[c];this.addGroup(h.start,h.count,h.materialIndex)}const a=t.boundingBox;a!==null&&(this.boundingBox=a.clone());const l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const jc=new ge,Si=new _o,Es=new ss,Kc=new k,ys=new k,Ts=new k,bs=new k,ta=new k,As=new k,$c=new k,ws=new k;class kn extends Ve{constructor(t=new tn,e=new Zh){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,i=Object.keys(e);if(i.length>0){const r=e[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,o=r.length;s<o;s++){const a=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=s}}}}getVertexPosition(t,e){const i=this.geometry,r=i.attributes.position,s=i.morphAttributes.position,o=i.morphTargetsRelative;e.fromBufferAttribute(r,t);const a=this.morphTargetInfluences;if(s&&a){As.set(0,0,0);for(let l=0,c=s.length;l<c;l++){const u=a[l],h=s[l];u!==0&&(ta.fromBufferAttribute(h,t),o?As.addScaledVector(ta,u):As.addScaledVector(ta.sub(e),u))}e.add(As)}return e}raycast(t,e){const i=this.geometry,r=this.material,s=this.matrixWorld;r!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Es.copy(i.boundingSphere),Es.applyMatrix4(s),Si.copy(t.ray).recast(t.near),!(Es.containsPoint(Si.origin)===!1&&(Si.intersectSphere(Es,Kc)===null||Si.origin.distanceToSquared(Kc)>(t.far-t.near)**2))&&(jc.copy(s).invert(),Si.copy(t.ray).applyMatrix4(jc),!(i.boundingBox!==null&&Si.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(t,e,Si)))}_computeIntersections(t,e,i){let r;const s=this.geometry,o=this.material,a=s.index,l=s.attributes.position,c=s.attributes.uv,u=s.attributes.uv1,h=s.attributes.normal,d=s.groups,p=s.drawRange;if(a!==null)if(Array.isArray(o))for(let x=0,S=d.length;x<S;x++){const g=d[x],f=o[g.materialIndex],P=Math.max(g.start,p.start),C=Math.min(a.count,Math.min(g.start+g.count,p.start+p.count));for(let b=P,O=C;b<O;b+=3){const F=a.getX(b),L=a.getX(b+1),V=a.getX(b+2);r=Rs(this,f,t,i,c,u,h,F,L,V),r&&(r.faceIndex=Math.floor(b/3),r.face.materialIndex=g.materialIndex,e.push(r))}}else{const x=Math.max(0,p.start),S=Math.min(a.count,p.start+p.count);for(let g=x,f=S;g<f;g+=3){const P=a.getX(g),C=a.getX(g+1),b=a.getX(g+2);r=Rs(this,o,t,i,c,u,h,P,C,b),r&&(r.faceIndex=Math.floor(g/3),e.push(r))}}else if(l!==void 0)if(Array.isArray(o))for(let x=0,S=d.length;x<S;x++){const g=d[x],f=o[g.materialIndex],P=Math.max(g.start,p.start),C=Math.min(l.count,Math.min(g.start+g.count,p.start+p.count));for(let b=P,O=C;b<O;b+=3){const F=b,L=b+1,V=b+2;r=Rs(this,f,t,i,c,u,h,F,L,V),r&&(r.faceIndex=Math.floor(b/3),r.face.materialIndex=g.materialIndex,e.push(r))}}else{const x=Math.max(0,p.start),S=Math.min(l.count,p.start+p.count);for(let g=x,f=S;g<f;g+=3){const P=g,C=g+1,b=g+2;r=Rs(this,o,t,i,c,u,h,P,C,b),r&&(r.faceIndex=Math.floor(g/3),e.push(r))}}}}function E_(n,t,e,i,r,s,o,a){let l;if(t.side===We?l=i.intersectTriangle(o,s,r,!0,a):l=i.intersectTriangle(r,s,o,t.side===fi,a),l===null)return null;ws.copy(a),ws.applyMatrix4(n.matrixWorld);const c=e.ray.origin.distanceTo(ws);return c<e.near||c>e.far?null:{distance:c,point:ws.clone(),object:n}}function Rs(n,t,e,i,r,s,o,a,l,c){n.getVertexPosition(a,ys),n.getVertexPosition(l,Ts),n.getVertexPosition(c,bs);const u=E_(n,t,e,i,ys,Ts,bs,$c);if(u){const h=new k;mn.getBarycoord($c,ys,Ts,bs,h),r&&(u.uv=mn.getInterpolatedAttribute(r,a,l,c,h,new Yt)),s&&(u.uv1=mn.getInterpolatedAttribute(s,a,l,c,h,new Yt)),o&&(u.normal=mn.getInterpolatedAttribute(o,a,l,c,h,new k),u.normal.dot(i.direction)>0&&u.normal.multiplyScalar(-1));const d={a,b:l,c,normal:new k,materialIndex:0};mn.getNormal(ys,Ts,bs,d.normal),u.face=d,u.barycoord=h}return u}class os extends tn{constructor(t=1,e=1,i=1,r=1,s=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:i,widthSegments:r,heightSegments:s,depthSegments:o};const a=this;r=Math.floor(r),s=Math.floor(s),o=Math.floor(o);const l=[],c=[],u=[],h=[];let d=0,p=0;x("z","y","x",-1,-1,i,e,t,o,s,0),x("z","y","x",1,-1,i,e,-t,o,s,1),x("x","z","y",1,1,t,i,e,r,o,2),x("x","z","y",1,-1,t,i,-e,r,o,3),x("x","y","z",1,-1,t,e,i,r,s,4),x("x","y","z",-1,-1,t,e,-i,r,s,5),this.setIndex(l),this.setAttribute("position",new Je(c,3)),this.setAttribute("normal",new Je(u,3)),this.setAttribute("uv",new Je(h,2));function x(S,g,f,P,C,b,O,F,L,V,w){const T=b/L,U=O/V,rt=b/2,Z=O/2,ot=F/2,at=L+1,et=V+1;let nt=0,G=0;const mt=new k;for(let St=0;St<et;St++){const xt=St*U-Z;for(let Ut=0;Ut<at;Ut++){const Kt=Ut*T-rt;mt[S]=Kt*P,mt[g]=xt*C,mt[f]=ot,c.push(mt.x,mt.y,mt.z),mt[S]=0,mt[g]=0,mt[f]=F>0?1:-1,u.push(mt.x,mt.y,mt.z),h.push(Ut/L),h.push(1-St/V),nt+=1}}for(let St=0;St<V;St++)for(let xt=0;xt<L;xt++){const Ut=d+xt+at*St,Kt=d+xt+at*(St+1),it=d+(xt+1)+at*(St+1),ft=d+(xt+1)+at*St;l.push(Ut,Kt,ft),l.push(Kt,it,ft),G+=6}a.addGroup(p,G,w),p+=G,d+=nt}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new os(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}function Mr(n){const t={};for(const e in n){t[e]={};for(const i in n[e]){const r=n[e][i];r&&(r.isColor||r.isMatrix3||r.isMatrix4||r.isVector2||r.isVector3||r.isVector4||r.isTexture||r.isQuaternion)?r.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][i]=null):t[e][i]=r.clone():Array.isArray(r)?t[e][i]=r.slice():t[e][i]=r}}return t}function Be(n){const t={};for(let e=0;e<n.length;e++){const i=Mr(n[e]);for(const r in i)t[r]=i[r]}return t}function y_(n){const t=[];for(let e=0;e<n.length;e++)t.push(n[e].clone());return t}function tf(n){const t=n.getRenderTarget();return t===null?n.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:Qt.workingColorSpace}const T_={clone:Mr,merge:Be};var b_=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,A_=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class Yn extends yr{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=b_,this.fragmentShader=A_,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=Mr(t.uniforms),this.uniformsGroups=y_(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){const e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(const r in this.uniforms){const o=this.uniforms[r].value;o&&o.isTexture?e.uniforms[r]={type:"t",value:o.toJSON(t).uuid}:o&&o.isColor?e.uniforms[r]={type:"c",value:o.getHex()}:o&&o.isVector2?e.uniforms[r]={type:"v2",value:o.toArray()}:o&&o.isVector3?e.uniforms[r]={type:"v3",value:o.toArray()}:o&&o.isVector4?e.uniforms[r]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?e.uniforms[r]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?e.uniforms[r]={type:"m4",value:o.toArray()}:e.uniforms[r]={value:o}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;const i={};for(const r in this.extensions)this.extensions[r]===!0&&(i[r]=!0);return Object.keys(i).length>0&&(e.extensions=i),e}}class ef extends Ve{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new ge,this.projectionMatrix=new ge,this.projectionMatrixInverse=new ge,this.coordinateSystem=Gn}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const ei=new k,Zc=new Yt,Jc=new Yt;class an extends ef{constructor(t=50,e=1,i=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=i,this.far=r,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const e=.5*this.getFilmHeight()/t;this.fov=Qr*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(Wr*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return Qr*2*Math.atan(Math.tan(Wr*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,i){ei.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(ei.x,ei.y).multiplyScalar(-t/ei.z),ei.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(ei.x,ei.y).multiplyScalar(-t/ei.z)}getViewSize(t,e){return this.getViewBounds(t,Zc,Jc),e.subVectors(Jc,Zc)}setViewOffset(t,e,i,r,s,o){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let e=t*Math.tan(Wr*.5*this.fov)/this.zoom,i=2*e,r=this.aspect*i,s=-.5*r;const o=this.view;if(this.view!==null&&this.view.enabled){const l=o.fullWidth,c=o.fullHeight;s+=o.offsetX*r/l,e-=o.offsetY*i/c,r*=o.width/l,i*=o.height/c}const a=this.filmOffset;a!==0&&(s+=t*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+r,e,e-i,t,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}}const Zi=-90,Ji=1;class w_ extends Ve{constructor(t,e,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;const r=new an(Zi,Ji,t,e);r.layers=this.layers,this.add(r);const s=new an(Zi,Ji,t,e);s.layers=this.layers,this.add(s);const o=new an(Zi,Ji,t,e);o.layers=this.layers,this.add(o);const a=new an(Zi,Ji,t,e);a.layers=this.layers,this.add(a);const l=new an(Zi,Ji,t,e);l.layers=this.layers,this.add(l);const c=new an(Zi,Ji,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const t=this.coordinateSystem,e=this.children.concat(),[i,r,s,o,a,l]=e;for(const c of e)this.remove(c);if(t===Gn)i.up.set(0,1,0),i.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===eo)i.up.set(0,-1,0),i.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();const{renderTarget:i,activeMipmapLevel:r}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[s,o,a,l,c,u]=this.children,h=t.getRenderTarget(),d=t.getActiveCubeFace(),p=t.getActiveMipmapLevel(),x=t.xr.enabled;t.xr.enabled=!1;const S=i.texture.generateMipmaps;i.texture.generateMipmaps=!1,t.setRenderTarget(i,0,r),t.render(e,s),t.setRenderTarget(i,1,r),t.render(e,o),t.setRenderTarget(i,2,r),t.render(e,a),t.setRenderTarget(i,3,r),t.render(e,l),t.setRenderTarget(i,4,r),t.render(e,c),i.texture.generateMipmaps=S,t.setRenderTarget(i,5,r),t.render(e,u),t.setRenderTarget(h,d,p),t.xr.enabled=x,i.texture.needsPMREMUpdate=!0}}class nf extends Xe{constructor(t,e,i,r,s,o,a,l,c,u){t=t!==void 0?t:[],e=e!==void 0?e:mr,super(t,e,i,r,s,o,a,l,c,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class R_ extends Ui{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;const i={width:t,height:t,depth:1},r=[i,i,i,i,i,i];this.texture=new nf(r,e.mapping,e.wrapS,e.wrapT,e.magFilter,e.minFilter,e.format,e.type,e.anisotropy,e.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=e.generateMipmaps!==void 0?e.generateMipmaps:!1,this.texture.minFilter=e.minFilter!==void 0?e.minFilter:Tn}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;const i={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new os(5,5,5),s=new Yn({name:"CubemapFromEquirect",uniforms:Mr(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:We,blending:ui});s.uniforms.tEquirect.value=e;const o=new kn(r,s),a=e.minFilter;return e.minFilter===Pi&&(e.minFilter=Tn),new w_(1,10,this).update(t,o),e.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(t,e,i,r){const s=t.getRenderTarget();for(let o=0;o<6;o++)t.setRenderTarget(this,o),t.clear(e,i,r);t.setRenderTarget(s)}}class C_ extends Ve{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new qn,this.environmentIntensity=1,this.environmentRotation=new qn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}}const ea=new k,P_=new k,D_=new Gt;class ri{constructor(t=new k(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,i,r){return this.normal.set(t,e,i),this.constant=r,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,i){const r=ea.subVectors(i,e).cross(P_.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(r,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){const i=t.delta(ea),r=this.normal.dot(i);if(r===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;const s=-(t.start.dot(this.normal)+this.constant)/r;return s<0||s>1?null:e.copy(t.start).addScaledVector(i,s)}intersectsLine(t){const e=this.distanceToPoint(t.start),i=this.distanceToPoint(t.end);return e<0&&i>0||i<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){const i=e||D_.getNormalMatrix(t),r=this.coplanarPoint(ea).applyMatrix4(t),s=this.normal.applyMatrix3(i).normalize();return this.constant=-r.dot(s),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}}const Ei=new ss,Cs=new k;class rf{constructor(t=new ri,e=new ri,i=new ri,r=new ri,s=new ri,o=new ri){this.planes=[t,e,i,r,s,o]}set(t,e,i,r,s,o){const a=this.planes;return a[0].copy(t),a[1].copy(e),a[2].copy(i),a[3].copy(r),a[4].copy(s),a[5].copy(o),this}copy(t){const e=this.planes;for(let i=0;i<6;i++)e[i].copy(t.planes[i]);return this}setFromProjectionMatrix(t,e=Gn){const i=this.planes,r=t.elements,s=r[0],o=r[1],a=r[2],l=r[3],c=r[4],u=r[5],h=r[6],d=r[7],p=r[8],x=r[9],S=r[10],g=r[11],f=r[12],P=r[13],C=r[14],b=r[15];if(i[0].setComponents(l-s,d-c,g-p,b-f).normalize(),i[1].setComponents(l+s,d+c,g+p,b+f).normalize(),i[2].setComponents(l+o,d+u,g+x,b+P).normalize(),i[3].setComponents(l-o,d-u,g-x,b-P).normalize(),i[4].setComponents(l-a,d-h,g-S,b-C).normalize(),e===Gn)i[5].setComponents(l+a,d+h,g+S,b+C).normalize();else if(e===eo)i[5].setComponents(a,h,S,C).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),Ei.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),Ei.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(Ei)}intersectsSprite(t){return Ei.center.set(0,0,0),Ei.radius=.7071067811865476,Ei.applyMatrix4(t.matrixWorld),this.intersectsSphere(Ei)}intersectsSphere(t){const e=this.planes,i=t.center,r=-t.radius;for(let s=0;s<6;s++)if(e[s].distanceToPoint(i)<r)return!1;return!0}intersectsBox(t){const e=this.planes;for(let i=0;i<6;i++){const r=e[i];if(Cs.x=r.normal.x>0?t.max.x:t.min.x,Cs.y=r.normal.y>0?t.max.y:t.min.y,Cs.z=r.normal.z>0?t.max.z:t.min.z,r.distanceToPoint(Cs)<0)return!1}return!0}containsPoint(t){const e=this.planes;for(let i=0;i<6;i++)if(e[i].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class sf extends yr{constructor(t){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new ee(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.linewidth=t.linewidth,this.linecap=t.linecap,this.linejoin=t.linejoin,this.fog=t.fog,this}}const io=new k,ro=new k,Qc=new ge,Lr=new _o,Ps=new ss,na=new k,tu=new k;class ia extends Ve{constructor(t=new tn,e=new sf){super(),this.isLine=!0,this.type="Line",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}computeLineDistances(){const t=this.geometry;if(t.index===null){const e=t.attributes.position,i=[0];for(let r=1,s=e.count;r<s;r++)io.fromBufferAttribute(e,r-1),ro.fromBufferAttribute(e,r),i[r]=i[r-1],i[r]+=io.distanceTo(ro);t.setAttribute("lineDistance",new Je(i,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(t,e){const i=this.geometry,r=this.matrixWorld,s=t.params.Line.threshold,o=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Ps.copy(i.boundingSphere),Ps.applyMatrix4(r),Ps.radius+=s,t.ray.intersectsSphere(Ps)===!1)return;Qc.copy(r).invert(),Lr.copy(t.ray).applyMatrix4(Qc);const a=s/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=this.isLineSegments?2:1,u=i.index,d=i.attributes.position;if(u!==null){const p=Math.max(0,o.start),x=Math.min(u.count,o.start+o.count);for(let S=p,g=x-1;S<g;S+=c){const f=u.getX(S),P=u.getX(S+1),C=Ds(this,t,Lr,l,f,P);C&&e.push(C)}if(this.isLineLoop){const S=u.getX(x-1),g=u.getX(p),f=Ds(this,t,Lr,l,S,g);f&&e.push(f)}}else{const p=Math.max(0,o.start),x=Math.min(d.count,o.start+o.count);for(let S=p,g=x-1;S<g;S+=c){const f=Ds(this,t,Lr,l,S,S+1);f&&e.push(f)}if(this.isLineLoop){const S=Ds(this,t,Lr,l,x-1,p);S&&e.push(S)}}}updateMorphTargets(){const e=this.geometry.morphAttributes,i=Object.keys(e);if(i.length>0){const r=e[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,o=r.length;s<o;s++){const a=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=s}}}}}function Ds(n,t,e,i,r,s){const o=n.geometry.attributes.position;if(io.fromBufferAttribute(o,r),ro.fromBufferAttribute(o,s),e.distanceSqToSegment(io,ro,na,tu)>i)return;na.applyMatrix4(n.matrixWorld);const l=t.ray.origin.distanceTo(na);if(!(l<t.near||l>t.far))return{distance:l,point:tu.clone().applyMatrix4(n.matrixWorld),index:r,face:null,faceIndex:null,barycoord:null,object:n}}class L_ extends yr{constructor(t){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new ee(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}}const eu=new ge,ll=new _o,Ls=new ss,Is=new k;class of extends Ve{constructor(t=new tn,e=new L_){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}raycast(t,e){const i=this.geometry,r=this.matrixWorld,s=t.params.Points.threshold,o=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Ls.copy(i.boundingSphere),Ls.applyMatrix4(r),Ls.radius+=s,t.ray.intersectsSphere(Ls)===!1)return;eu.copy(r).invert(),ll.copy(t.ray).applyMatrix4(eu);const a=s/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=i.index,h=i.attributes.position;if(c!==null){const d=Math.max(0,o.start),p=Math.min(c.count,o.start+o.count);for(let x=d,S=p;x<S;x++){const g=c.getX(x);Is.fromBufferAttribute(h,g),nu(Is,g,l,r,t,e,this)}}else{const d=Math.max(0,o.start),p=Math.min(h.count,o.start+o.count);for(let x=d,S=p;x<S;x++)Is.fromBufferAttribute(h,x),nu(Is,x,l,r,t,e,this)}}updateMorphTargets(){const e=this.geometry.morphAttributes,i=Object.keys(e);if(i.length>0){const r=e[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,o=r.length;s<o;s++){const a=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=s}}}}}function nu(n,t,e,i,r,s,o){const a=ll.distanceSqToPoint(n);if(a<e){const l=new k;ll.closestPointToPoint(n,l),l.applyMatrix4(i);const c=r.ray.origin.distanceTo(l);if(c<r.near||c>r.far)return;s.push({distance:c,distanceToRay:Math.sqrt(a),point:l,index:t,face:null,faceIndex:null,barycoord:null,object:o})}}class Us extends Ve{constructor(){super(),this.isGroup=!0,this.type="Group"}}class af extends Xe{constructor(t,e,i,r,s,o,a,l,c,u=ur){if(u!==ur&&u!==vr)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");i===void 0&&u===ur&&(i=Ii),i===void 0&&u===vr&&(i=gr),super(null,r,s,o,a,l,u,i,c),this.isDepthTexture=!0,this.image={width:t,height:e},this.magFilter=a!==void 0?a:xn,this.minFilter=l!==void 0?l:xn,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}}class go extends tn{constructor(t=1,e=1,i=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:i,heightSegments:r};const s=t/2,o=e/2,a=Math.floor(i),l=Math.floor(r),c=a+1,u=l+1,h=t/a,d=e/l,p=[],x=[],S=[],g=[];for(let f=0;f<u;f++){const P=f*d-o;for(let C=0;C<c;C++){const b=C*h-s;x.push(b,-P,0),S.push(0,0,1),g.push(C/a),g.push(1-f/l)}}for(let f=0;f<l;f++)for(let P=0;P<a;P++){const C=P+c*f,b=P+c*(f+1),O=P+1+c*(f+1),F=P+1+c*f;p.push(C,b,F),p.push(b,O,F)}this.setIndex(p),this.setAttribute("position",new Je(x,3)),this.setAttribute("normal",new Je(S,3)),this.setAttribute("uv",new Je(g,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new go(t.width,t.height,t.widthSegments,t.heightSegments)}}class I_ extends yr{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Cm,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class U_ extends yr{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}class N_ extends ef{constructor(t=-1,e=1,i=1,r=-1,s=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=i,this.bottom=r,this.near=s,this.far=o,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,i,r,s,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,r=(this.top+this.bottom)/2;let s=i-t,o=i+t,a=r+e,l=r-e;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=c*this.view.offsetX,o=s+c*this.view.width,a-=u*this.view.offsetY,l=a-u*this.view.height}this.projectionMatrix.makeOrthographic(s,o,a,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}}class F_ extends an{constructor(t=[]){super(),this.isArrayCamera=!0,this.cameras=t}}class iu{constructor(t=1,e=0,i=0){return this.radius=t,this.phi=e,this.theta=i,this}set(t,e,i){return this.radius=t,this.phi=e,this.theta=i,this}copy(t){return this.radius=t.radius,this.phi=t.phi,this.theta=t.theta,this}makeSafe(){return this.phi=jt(this.phi,1e-6,Math.PI-1e-6),this}setFromVector3(t){return this.setFromCartesianCoords(t.x,t.y,t.z)}setFromCartesianCoords(t,e,i){return this.radius=Math.sqrt(t*t+e*e+i*i),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(t,i),this.phi=Math.acos(jt(e/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}}class O_ extends Oi{constructor(t,e=null){super(),this.object=t,this.domElement=e,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(){}disconnect(){}dispose(){}update(){}}function ru(n,t,e,i){const r=B_(i);switch(e){case Bh:return n*t;case Hh:return n*t;case Vh:return n*t*2;case Gh:return n*t/r.components*r.byteLength;case zl:return n*t/r.components*r.byteLength;case kh:return n*t*2/r.components*r.byteLength;case Hl:return n*t*2/r.components*r.byteLength;case zh:return n*t*3/r.components*r.byteLength;case gn:return n*t*4/r.components*r.byteLength;case Vl:return n*t*4/r.components*r.byteLength;case Gs:case ks:return Math.floor((n+3)/4)*Math.floor((t+3)/4)*8;case Ws:case Xs:return Math.floor((n+3)/4)*Math.floor((t+3)/4)*16;case Oa:case za:return Math.max(n,16)*Math.max(t,8)/4;case Fa:case Ba:return Math.max(n,8)*Math.max(t,8)/2;case Ha:case Va:return Math.floor((n+3)/4)*Math.floor((t+3)/4)*8;case Ga:return Math.floor((n+3)/4)*Math.floor((t+3)/4)*16;case ka:return Math.floor((n+3)/4)*Math.floor((t+3)/4)*16;case Wa:return Math.floor((n+4)/5)*Math.floor((t+3)/4)*16;case Xa:return Math.floor((n+4)/5)*Math.floor((t+4)/5)*16;case qa:return Math.floor((n+5)/6)*Math.floor((t+4)/5)*16;case Ya:return Math.floor((n+5)/6)*Math.floor((t+5)/6)*16;case ja:return Math.floor((n+7)/8)*Math.floor((t+4)/5)*16;case Ka:return Math.floor((n+7)/8)*Math.floor((t+5)/6)*16;case $a:return Math.floor((n+7)/8)*Math.floor((t+7)/8)*16;case Za:return Math.floor((n+9)/10)*Math.floor((t+4)/5)*16;case Ja:return Math.floor((n+9)/10)*Math.floor((t+5)/6)*16;case Qa:return Math.floor((n+9)/10)*Math.floor((t+7)/8)*16;case tl:return Math.floor((n+9)/10)*Math.floor((t+9)/10)*16;case el:return Math.floor((n+11)/12)*Math.floor((t+9)/10)*16;case nl:return Math.floor((n+11)/12)*Math.floor((t+11)/12)*16;case qs:case il:case rl:return Math.ceil(n/4)*Math.ceil(t/4)*16;case Wh:case sl:return Math.ceil(n/4)*Math.ceil(t/4)*8;case ol:case al:return Math.ceil(n/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function B_(n){switch(n){case Xn:case Nh:return{byteLength:1,components:1};case Jr:case Fh:case is:return{byteLength:2,components:1};case Ol:case Bl:return{byteLength:2,components:4};case Ii:case Fl:case Vn:return{byteLength:4,components:1};case Oh:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${n}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Nl}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Nl);/**
 * @license
 * Copyright 2010-2024 Three.js Authors
 * SPDX-License-Identifier: MIT
 */function lf(){let n=null,t=!1,e=null,i=null;function r(s,o){e(s,o),i=n.requestAnimationFrame(r)}return{start:function(){t!==!0&&e!==null&&(i=n.requestAnimationFrame(r),t=!0)},stop:function(){n.cancelAnimationFrame(i),t=!1},setAnimationLoop:function(s){e=s},setContext:function(s){n=s}}}function z_(n){const t=new WeakMap;function e(a,l){const c=a.array,u=a.usage,h=c.byteLength,d=n.createBuffer();n.bindBuffer(l,d),n.bufferData(l,c,u),a.onUploadCallback();let p;if(c instanceof Float32Array)p=n.FLOAT;else if(c instanceof Uint16Array)a.isFloat16BufferAttribute?p=n.HALF_FLOAT:p=n.UNSIGNED_SHORT;else if(c instanceof Int16Array)p=n.SHORT;else if(c instanceof Uint32Array)p=n.UNSIGNED_INT;else if(c instanceof Int32Array)p=n.INT;else if(c instanceof Int8Array)p=n.BYTE;else if(c instanceof Uint8Array)p=n.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)p=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:d,type:p,bytesPerElement:c.BYTES_PER_ELEMENT,version:a.version,size:h}}function i(a,l,c){const u=l.array,h=l.updateRanges;if(n.bindBuffer(c,a),h.length===0)n.bufferSubData(c,0,u);else{h.sort((p,x)=>p.start-x.start);let d=0;for(let p=1;p<h.length;p++){const x=h[d],S=h[p];S.start<=x.start+x.count+1?x.count=Math.max(x.count,S.start+S.count-x.start):(++d,h[d]=S)}h.length=d+1;for(let p=0,x=h.length;p<x;p++){const S=h[p];n.bufferSubData(c,S.start*u.BYTES_PER_ELEMENT,u,S.start,S.count)}l.clearUpdateRanges()}l.onUploadCallback()}function r(a){return a.isInterleavedBufferAttribute&&(a=a.data),t.get(a)}function s(a){a.isInterleavedBufferAttribute&&(a=a.data);const l=t.get(a);l&&(n.deleteBuffer(l.buffer),t.delete(a))}function o(a,l){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){const u=t.get(a);(!u||u.version<a.version)&&t.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}const c=t.get(a);if(c===void 0)t.set(a,e(a,l));else if(c.version<a.version){if(c.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(c.buffer,a,l),c.version=a.version}}return{get:r,remove:s,update:o}}var H_=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,V_=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,G_=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,k_=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,W_=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,X_=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,q_=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Y_=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,j_=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,K_=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,$_=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Z_=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,J_=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,Q_=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,tg=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,eg=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,ng=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,ig=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,rg=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,sg=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,og=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,ag=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,lg=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,cg=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,ug=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,hg=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,fg=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,dg=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,pg=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,mg=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,_g="gl_FragColor = linearToOutputTexel( gl_FragColor );",gg=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,vg=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,xg=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Mg=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Sg=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Eg=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,yg=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Tg=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,bg=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Ag=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,wg=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Rg=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Cg=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Pg=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Dg=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,Lg=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,Ig=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Ug=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Ng=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Fg=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Og=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Bg=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,zg=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Hg=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Vg=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Gg=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,kg=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Wg=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Xg=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,qg=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Yg=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,jg=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Kg=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,$g=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Zg=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Jg=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Qg=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,tv=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,ev=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,nv=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,iv=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,rv=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,sv=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,ov=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,av=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,lv=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,cv=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,uv=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,hv=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,fv=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,dv=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,pv=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,mv=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,_v=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,gv=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,vv=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,xv=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Mv=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Sv=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,Ev=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,yv=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Tv=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,bv=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Av=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,wv=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Rv=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Cv=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Pv=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Dv=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Lv=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Iv=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Uv=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
		
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
		
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		
		#else
		
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Nv=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Fv=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Ov=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Bv=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const zv=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Hv=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Vv=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Gv=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,kv=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Wv=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Xv=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,qv=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,Yv=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,jv=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,Kv=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,$v=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Zv=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Jv=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Qv=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,t0=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,e0=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,n0=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,i0=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,r0=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,s0=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,o0=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,a0=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,l0=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,c0=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,u0=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,h0=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,f0=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,d0=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,p0=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,m0=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,_0=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,g0=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,v0=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,kt={alphahash_fragment:H_,alphahash_pars_fragment:V_,alphamap_fragment:G_,alphamap_pars_fragment:k_,alphatest_fragment:W_,alphatest_pars_fragment:X_,aomap_fragment:q_,aomap_pars_fragment:Y_,batching_pars_vertex:j_,batching_vertex:K_,begin_vertex:$_,beginnormal_vertex:Z_,bsdfs:J_,iridescence_fragment:Q_,bumpmap_pars_fragment:tg,clipping_planes_fragment:eg,clipping_planes_pars_fragment:ng,clipping_planes_pars_vertex:ig,clipping_planes_vertex:rg,color_fragment:sg,color_pars_fragment:og,color_pars_vertex:ag,color_vertex:lg,common:cg,cube_uv_reflection_fragment:ug,defaultnormal_vertex:hg,displacementmap_pars_vertex:fg,displacementmap_vertex:dg,emissivemap_fragment:pg,emissivemap_pars_fragment:mg,colorspace_fragment:_g,colorspace_pars_fragment:gg,envmap_fragment:vg,envmap_common_pars_fragment:xg,envmap_pars_fragment:Mg,envmap_pars_vertex:Sg,envmap_physical_pars_fragment:Lg,envmap_vertex:Eg,fog_vertex:yg,fog_pars_vertex:Tg,fog_fragment:bg,fog_pars_fragment:Ag,gradientmap_pars_fragment:wg,lightmap_pars_fragment:Rg,lights_lambert_fragment:Cg,lights_lambert_pars_fragment:Pg,lights_pars_begin:Dg,lights_toon_fragment:Ig,lights_toon_pars_fragment:Ug,lights_phong_fragment:Ng,lights_phong_pars_fragment:Fg,lights_physical_fragment:Og,lights_physical_pars_fragment:Bg,lights_fragment_begin:zg,lights_fragment_maps:Hg,lights_fragment_end:Vg,logdepthbuf_fragment:Gg,logdepthbuf_pars_fragment:kg,logdepthbuf_pars_vertex:Wg,logdepthbuf_vertex:Xg,map_fragment:qg,map_pars_fragment:Yg,map_particle_fragment:jg,map_particle_pars_fragment:Kg,metalnessmap_fragment:$g,metalnessmap_pars_fragment:Zg,morphinstance_vertex:Jg,morphcolor_vertex:Qg,morphnormal_vertex:tv,morphtarget_pars_vertex:ev,morphtarget_vertex:nv,normal_fragment_begin:iv,normal_fragment_maps:rv,normal_pars_fragment:sv,normal_pars_vertex:ov,normal_vertex:av,normalmap_pars_fragment:lv,clearcoat_normal_fragment_begin:cv,clearcoat_normal_fragment_maps:uv,clearcoat_pars_fragment:hv,iridescence_pars_fragment:fv,opaque_fragment:dv,packing:pv,premultiplied_alpha_fragment:mv,project_vertex:_v,dithering_fragment:gv,dithering_pars_fragment:vv,roughnessmap_fragment:xv,roughnessmap_pars_fragment:Mv,shadowmap_pars_fragment:Sv,shadowmap_pars_vertex:Ev,shadowmap_vertex:yv,shadowmask_pars_fragment:Tv,skinbase_vertex:bv,skinning_pars_vertex:Av,skinning_vertex:wv,skinnormal_vertex:Rv,specularmap_fragment:Cv,specularmap_pars_fragment:Pv,tonemapping_fragment:Dv,tonemapping_pars_fragment:Lv,transmission_fragment:Iv,transmission_pars_fragment:Uv,uv_pars_fragment:Nv,uv_pars_vertex:Fv,uv_vertex:Ov,worldpos_vertex:Bv,background_vert:zv,background_frag:Hv,backgroundCube_vert:Vv,backgroundCube_frag:Gv,cube_vert:kv,cube_frag:Wv,depth_vert:Xv,depth_frag:qv,distanceRGBA_vert:Yv,distanceRGBA_frag:jv,equirect_vert:Kv,equirect_frag:$v,linedashed_vert:Zv,linedashed_frag:Jv,meshbasic_vert:Qv,meshbasic_frag:t0,meshlambert_vert:e0,meshlambert_frag:n0,meshmatcap_vert:i0,meshmatcap_frag:r0,meshnormal_vert:s0,meshnormal_frag:o0,meshphong_vert:a0,meshphong_frag:l0,meshphysical_vert:c0,meshphysical_frag:u0,meshtoon_vert:h0,meshtoon_frag:f0,points_vert:d0,points_frag:p0,shadow_vert:m0,shadow_frag:_0,sprite_vert:g0,sprite_frag:v0},yt={common:{diffuse:{value:new ee(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Gt},alphaMap:{value:null},alphaMapTransform:{value:new Gt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Gt}},envmap:{envMap:{value:null},envMapRotation:{value:new Gt},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Gt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Gt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Gt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Gt},normalScale:{value:new Yt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Gt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Gt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Gt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Gt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new ee(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new ee(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Gt},alphaTest:{value:0},uvTransform:{value:new Gt}},sprite:{diffuse:{value:new ee(16777215)},opacity:{value:1},center:{value:new Yt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Gt},alphaMap:{value:null},alphaMapTransform:{value:new Gt},alphaTest:{value:0}}},yn={basic:{uniforms:Be([yt.common,yt.specularmap,yt.envmap,yt.aomap,yt.lightmap,yt.fog]),vertexShader:kt.meshbasic_vert,fragmentShader:kt.meshbasic_frag},lambert:{uniforms:Be([yt.common,yt.specularmap,yt.envmap,yt.aomap,yt.lightmap,yt.emissivemap,yt.bumpmap,yt.normalmap,yt.displacementmap,yt.fog,yt.lights,{emissive:{value:new ee(0)}}]),vertexShader:kt.meshlambert_vert,fragmentShader:kt.meshlambert_frag},phong:{uniforms:Be([yt.common,yt.specularmap,yt.envmap,yt.aomap,yt.lightmap,yt.emissivemap,yt.bumpmap,yt.normalmap,yt.displacementmap,yt.fog,yt.lights,{emissive:{value:new ee(0)},specular:{value:new ee(1118481)},shininess:{value:30}}]),vertexShader:kt.meshphong_vert,fragmentShader:kt.meshphong_frag},standard:{uniforms:Be([yt.common,yt.envmap,yt.aomap,yt.lightmap,yt.emissivemap,yt.bumpmap,yt.normalmap,yt.displacementmap,yt.roughnessmap,yt.metalnessmap,yt.fog,yt.lights,{emissive:{value:new ee(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:kt.meshphysical_vert,fragmentShader:kt.meshphysical_frag},toon:{uniforms:Be([yt.common,yt.aomap,yt.lightmap,yt.emissivemap,yt.bumpmap,yt.normalmap,yt.displacementmap,yt.gradientmap,yt.fog,yt.lights,{emissive:{value:new ee(0)}}]),vertexShader:kt.meshtoon_vert,fragmentShader:kt.meshtoon_frag},matcap:{uniforms:Be([yt.common,yt.bumpmap,yt.normalmap,yt.displacementmap,yt.fog,{matcap:{value:null}}]),vertexShader:kt.meshmatcap_vert,fragmentShader:kt.meshmatcap_frag},points:{uniforms:Be([yt.points,yt.fog]),vertexShader:kt.points_vert,fragmentShader:kt.points_frag},dashed:{uniforms:Be([yt.common,yt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:kt.linedashed_vert,fragmentShader:kt.linedashed_frag},depth:{uniforms:Be([yt.common,yt.displacementmap]),vertexShader:kt.depth_vert,fragmentShader:kt.depth_frag},normal:{uniforms:Be([yt.common,yt.bumpmap,yt.normalmap,yt.displacementmap,{opacity:{value:1}}]),vertexShader:kt.meshnormal_vert,fragmentShader:kt.meshnormal_frag},sprite:{uniforms:Be([yt.sprite,yt.fog]),vertexShader:kt.sprite_vert,fragmentShader:kt.sprite_frag},background:{uniforms:{uvTransform:{value:new Gt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:kt.background_vert,fragmentShader:kt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Gt}},vertexShader:kt.backgroundCube_vert,fragmentShader:kt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:kt.cube_vert,fragmentShader:kt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:kt.equirect_vert,fragmentShader:kt.equirect_frag},distanceRGBA:{uniforms:Be([yt.common,yt.displacementmap,{referencePosition:{value:new k},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:kt.distanceRGBA_vert,fragmentShader:kt.distanceRGBA_frag},shadow:{uniforms:Be([yt.lights,yt.fog,{color:{value:new ee(0)},opacity:{value:1}}]),vertexShader:kt.shadow_vert,fragmentShader:kt.shadow_frag}};yn.physical={uniforms:Be([yn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Gt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Gt},clearcoatNormalScale:{value:new Yt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Gt},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Gt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Gt},sheen:{value:0},sheenColor:{value:new ee(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Gt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Gt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Gt},transmissionSamplerSize:{value:new Yt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Gt},attenuationDistance:{value:0},attenuationColor:{value:new ee(0)},specularColor:{value:new ee(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Gt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Gt},anisotropyVector:{value:new Yt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Gt}}]),vertexShader:kt.meshphysical_vert,fragmentShader:kt.meshphysical_frag};const Ns={r:0,b:0,g:0},yi=new qn,x0=new ge;function M0(n,t,e,i,r,s,o){const a=new ee(0);let l=s===!0?0:1,c,u,h=null,d=0,p=null;function x(C){let b=C.isScene===!0?C.background:null;return b&&b.isTexture&&(b=(C.backgroundBlurriness>0?e:t).get(b)),b}function S(C){let b=!1;const O=x(C);O===null?f(a,l):O&&O.isColor&&(f(O,1),b=!0);const F=n.xr.getEnvironmentBlendMode();F==="additive"?i.buffers.color.setClear(0,0,0,1,o):F==="alpha-blend"&&i.buffers.color.setClear(0,0,0,0,o),(n.autoClear||b)&&(i.buffers.depth.setTest(!0),i.buffers.depth.setMask(!0),i.buffers.color.setMask(!0),n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil))}function g(C,b){const O=x(b);O&&(O.isCubeTexture||O.mapping===mo)?(u===void 0&&(u=new kn(new os(1,1,1),new Yn({name:"BackgroundCubeMaterial",uniforms:Mr(yn.backgroundCube.uniforms),vertexShader:yn.backgroundCube.vertexShader,fragmentShader:yn.backgroundCube.fragmentShader,side:We,depthTest:!1,depthWrite:!1,fog:!1})),u.geometry.deleteAttribute("normal"),u.geometry.deleteAttribute("uv"),u.onBeforeRender=function(F,L,V){this.matrixWorld.copyPosition(V.matrixWorld)},Object.defineProperty(u.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(u)),yi.copy(b.backgroundRotation),yi.x*=-1,yi.y*=-1,yi.z*=-1,O.isCubeTexture&&O.isRenderTargetTexture===!1&&(yi.y*=-1,yi.z*=-1),u.material.uniforms.envMap.value=O,u.material.uniforms.flipEnvMap.value=O.isCubeTexture&&O.isRenderTargetTexture===!1?-1:1,u.material.uniforms.backgroundBlurriness.value=b.backgroundBlurriness,u.material.uniforms.backgroundIntensity.value=b.backgroundIntensity,u.material.uniforms.backgroundRotation.value.setFromMatrix4(x0.makeRotationFromEuler(yi)),u.material.toneMapped=Qt.getTransfer(O.colorSpace)!==oe,(h!==O||d!==O.version||p!==n.toneMapping)&&(u.material.needsUpdate=!0,h=O,d=O.version,p=n.toneMapping),u.layers.enableAll(),C.unshift(u,u.geometry,u.material,0,0,null)):O&&O.isTexture&&(c===void 0&&(c=new kn(new go(2,2),new Yn({name:"BackgroundMaterial",uniforms:Mr(yn.background.uniforms),vertexShader:yn.background.vertexShader,fragmentShader:yn.background.fragmentShader,side:fi,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(c)),c.material.uniforms.t2D.value=O,c.material.uniforms.backgroundIntensity.value=b.backgroundIntensity,c.material.toneMapped=Qt.getTransfer(O.colorSpace)!==oe,O.matrixAutoUpdate===!0&&O.updateMatrix(),c.material.uniforms.uvTransform.value.copy(O.matrix),(h!==O||d!==O.version||p!==n.toneMapping)&&(c.material.needsUpdate=!0,h=O,d=O.version,p=n.toneMapping),c.layers.enableAll(),C.unshift(c,c.geometry,c.material,0,0,null))}function f(C,b){C.getRGB(Ns,tf(n)),i.buffers.color.setClear(Ns.r,Ns.g,Ns.b,b,o)}function P(){u!==void 0&&(u.geometry.dispose(),u.material.dispose()),c!==void 0&&(c.geometry.dispose(),c.material.dispose())}return{getClearColor:function(){return a},setClearColor:function(C,b=1){a.set(C),l=b,f(a,l)},getClearAlpha:function(){return l},setClearAlpha:function(C){l=C,f(a,l)},render:S,addToRenderList:g,dispose:P}}function S0(n,t){const e=n.getParameter(n.MAX_VERTEX_ATTRIBS),i={},r=d(null);let s=r,o=!1;function a(T,U,rt,Z,ot){let at=!1;const et=h(Z,rt,U);s!==et&&(s=et,c(s.object)),at=p(T,Z,rt,ot),at&&x(T,Z,rt,ot),ot!==null&&t.update(ot,n.ELEMENT_ARRAY_BUFFER),(at||o)&&(o=!1,b(T,U,rt,Z),ot!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,t.get(ot).buffer))}function l(){return n.createVertexArray()}function c(T){return n.bindVertexArray(T)}function u(T){return n.deleteVertexArray(T)}function h(T,U,rt){const Z=rt.wireframe===!0;let ot=i[T.id];ot===void 0&&(ot={},i[T.id]=ot);let at=ot[U.id];at===void 0&&(at={},ot[U.id]=at);let et=at[Z];return et===void 0&&(et=d(l()),at[Z]=et),et}function d(T){const U=[],rt=[],Z=[];for(let ot=0;ot<e;ot++)U[ot]=0,rt[ot]=0,Z[ot]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:U,enabledAttributes:rt,attributeDivisors:Z,object:T,attributes:{},index:null}}function p(T,U,rt,Z){const ot=s.attributes,at=U.attributes;let et=0;const nt=rt.getAttributes();for(const G in nt)if(nt[G].location>=0){const St=ot[G];let xt=at[G];if(xt===void 0&&(G==="instanceMatrix"&&T.instanceMatrix&&(xt=T.instanceMatrix),G==="instanceColor"&&T.instanceColor&&(xt=T.instanceColor)),St===void 0||St.attribute!==xt||xt&&St.data!==xt.data)return!0;et++}return s.attributesNum!==et||s.index!==Z}function x(T,U,rt,Z){const ot={},at=U.attributes;let et=0;const nt=rt.getAttributes();for(const G in nt)if(nt[G].location>=0){let St=at[G];St===void 0&&(G==="instanceMatrix"&&T.instanceMatrix&&(St=T.instanceMatrix),G==="instanceColor"&&T.instanceColor&&(St=T.instanceColor));const xt={};xt.attribute=St,St&&St.data&&(xt.data=St.data),ot[G]=xt,et++}s.attributes=ot,s.attributesNum=et,s.index=Z}function S(){const T=s.newAttributes;for(let U=0,rt=T.length;U<rt;U++)T[U]=0}function g(T){f(T,0)}function f(T,U){const rt=s.newAttributes,Z=s.enabledAttributes,ot=s.attributeDivisors;rt[T]=1,Z[T]===0&&(n.enableVertexAttribArray(T),Z[T]=1),ot[T]!==U&&(n.vertexAttribDivisor(T,U),ot[T]=U)}function P(){const T=s.newAttributes,U=s.enabledAttributes;for(let rt=0,Z=U.length;rt<Z;rt++)U[rt]!==T[rt]&&(n.disableVertexAttribArray(rt),U[rt]=0)}function C(T,U,rt,Z,ot,at,et){et===!0?n.vertexAttribIPointer(T,U,rt,ot,at):n.vertexAttribPointer(T,U,rt,Z,ot,at)}function b(T,U,rt,Z){S();const ot=Z.attributes,at=rt.getAttributes(),et=U.defaultAttributeValues;for(const nt in at){const G=at[nt];if(G.location>=0){let mt=ot[nt];if(mt===void 0&&(nt==="instanceMatrix"&&T.instanceMatrix&&(mt=T.instanceMatrix),nt==="instanceColor"&&T.instanceColor&&(mt=T.instanceColor)),mt!==void 0){const St=mt.normalized,xt=mt.itemSize,Ut=t.get(mt);if(Ut===void 0)continue;const Kt=Ut.buffer,it=Ut.type,ft=Ut.bytesPerElement,At=it===n.INT||it===n.UNSIGNED_INT||mt.gpuType===Fl;if(mt.isInterleavedBufferAttribute){const gt=mt.data,Dt=gt.stride,Ft=mt.offset;if(gt.isInstancedInterleavedBuffer){for(let Bt=0;Bt<G.locationSize;Bt++)f(G.location+Bt,gt.meshPerAttribute);T.isInstancedMesh!==!0&&Z._maxInstanceCount===void 0&&(Z._maxInstanceCount=gt.meshPerAttribute*gt.count)}else for(let Bt=0;Bt<G.locationSize;Bt++)g(G.location+Bt);n.bindBuffer(n.ARRAY_BUFFER,Kt);for(let Bt=0;Bt<G.locationSize;Bt++)C(G.location+Bt,xt/G.locationSize,it,St,Dt*ft,(Ft+xt/G.locationSize*Bt)*ft,At)}else{if(mt.isInstancedBufferAttribute){for(let gt=0;gt<G.locationSize;gt++)f(G.location+gt,mt.meshPerAttribute);T.isInstancedMesh!==!0&&Z._maxInstanceCount===void 0&&(Z._maxInstanceCount=mt.meshPerAttribute*mt.count)}else for(let gt=0;gt<G.locationSize;gt++)g(G.location+gt);n.bindBuffer(n.ARRAY_BUFFER,Kt);for(let gt=0;gt<G.locationSize;gt++)C(G.location+gt,xt/G.locationSize,it,St,xt*ft,xt/G.locationSize*gt*ft,At)}}else if(et!==void 0){const St=et[nt];if(St!==void 0)switch(St.length){case 2:n.vertexAttrib2fv(G.location,St);break;case 3:n.vertexAttrib3fv(G.location,St);break;case 4:n.vertexAttrib4fv(G.location,St);break;default:n.vertexAttrib1fv(G.location,St)}}}}P()}function O(){V();for(const T in i){const U=i[T];for(const rt in U){const Z=U[rt];for(const ot in Z)u(Z[ot].object),delete Z[ot];delete U[rt]}delete i[T]}}function F(T){if(i[T.id]===void 0)return;const U=i[T.id];for(const rt in U){const Z=U[rt];for(const ot in Z)u(Z[ot].object),delete Z[ot];delete U[rt]}delete i[T.id]}function L(T){for(const U in i){const rt=i[U];if(rt[T.id]===void 0)continue;const Z=rt[T.id];for(const ot in Z)u(Z[ot].object),delete Z[ot];delete rt[T.id]}}function V(){w(),o=!0,s!==r&&(s=r,c(s.object))}function w(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:a,reset:V,resetDefaultState:w,dispose:O,releaseStatesOfGeometry:F,releaseStatesOfProgram:L,initAttributes:S,enableAttribute:g,disableUnusedAttributes:P}}function E0(n,t,e){let i;function r(c){i=c}function s(c,u){n.drawArrays(i,c,u),e.update(u,i,1)}function o(c,u,h){h!==0&&(n.drawArraysInstanced(i,c,u,h),e.update(u,i,h))}function a(c,u,h){if(h===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,c,0,u,0,h);let p=0;for(let x=0;x<h;x++)p+=u[x];e.update(p,i,1)}function l(c,u,h,d){if(h===0)return;const p=t.get("WEBGL_multi_draw");if(p===null)for(let x=0;x<c.length;x++)o(c[x],u[x],d[x]);else{p.multiDrawArraysInstancedWEBGL(i,c,0,u,0,d,0,h);let x=0;for(let S=0;S<h;S++)x+=u[S]*d[S];e.update(x,i,1)}}this.setMode=r,this.render=s,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=l}function y0(n,t,e,i){let r;function s(){if(r!==void 0)return r;if(t.has("EXT_texture_filter_anisotropic")===!0){const L=t.get("EXT_texture_filter_anisotropic");r=n.getParameter(L.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function o(L){return!(L!==gn&&i.convert(L)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(L){const V=L===is&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(L!==Xn&&i.convert(L)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_TYPE)&&L!==Vn&&!V)}function l(L){if(L==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";L="mediump"}return L==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=e.precision!==void 0?e.precision:"highp";const u=l(c);u!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",u,"instead."),c=u);const h=e.logarithmicDepthBuffer===!0,d=e.reverseDepthBuffer===!0&&t.has("EXT_clip_control"),p=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),x=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),S=n.getParameter(n.MAX_TEXTURE_SIZE),g=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),f=n.getParameter(n.MAX_VERTEX_ATTRIBS),P=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),C=n.getParameter(n.MAX_VARYING_VECTORS),b=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),O=x>0,F=n.getParameter(n.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:l,textureFormatReadable:o,textureTypeReadable:a,precision:c,logarithmicDepthBuffer:h,reverseDepthBuffer:d,maxTextures:p,maxVertexTextures:x,maxTextureSize:S,maxCubemapSize:g,maxAttributes:f,maxVertexUniforms:P,maxVaryings:C,maxFragmentUniforms:b,vertexTextures:O,maxSamples:F}}function T0(n){const t=this;let e=null,i=0,r=!1,s=!1;const o=new ri,a=new Gt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(h,d){const p=h.length!==0||d||i!==0||r;return r=d,i=h.length,p},this.beginShadows=function(){s=!0,u(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(h,d){e=u(h,d,0)},this.setState=function(h,d,p){const x=h.clippingPlanes,S=h.clipIntersection,g=h.clipShadows,f=n.get(h);if(!r||x===null||x.length===0||s&&!g)s?u(null):c();else{const P=s?0:i,C=P*4;let b=f.clippingState||null;l.value=b,b=u(x,d,C,p);for(let O=0;O!==C;++O)b[O]=e[O];f.clippingState=b,this.numIntersection=S?this.numPlanes:0,this.numPlanes+=P}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=i>0),t.numPlanes=i,t.numIntersection=0}function u(h,d,p,x){const S=h!==null?h.length:0;let g=null;if(S!==0){if(g=l.value,x!==!0||g===null){const f=p+S*4,P=d.matrixWorldInverse;a.getNormalMatrix(P),(g===null||g.length<f)&&(g=new Float32Array(f));for(let C=0,b=p;C!==S;++C,b+=4)o.copy(h[C]).applyMatrix4(P,a),o.normal.toArray(g,b),g[b+3]=o.constant}l.value=g,l.needsUpdate=!0}return t.numPlanes=S,t.numIntersection=0,g}}function b0(n){let t=new WeakMap;function e(o,a){return a===La?o.mapping=mr:a===Ia&&(o.mapping=_r),o}function i(o){if(o&&o.isTexture){const a=o.mapping;if(a===La||a===Ia)if(t.has(o)){const l=t.get(o).texture;return e(l,o.mapping)}else{const l=o.image;if(l&&l.height>0){const c=new R_(l.height);return c.fromEquirectangularTexture(n,o),t.set(o,c),o.addEventListener("dispose",r),e(c.texture,o.mapping)}else return null}}return o}function r(o){const a=o.target;a.removeEventListener("dispose",r);const l=t.get(a);l!==void 0&&(t.delete(a),l.dispose())}function s(){t=new WeakMap}return{get:i,dispose:s}}const rr=4,su=[.125,.215,.35,.446,.526,.582],Ri=20,ra=new N_,ou=new ee;let sa=null,oa=0,aa=0,la=!1;const Ai=(1+Math.sqrt(5))/2,Qi=1/Ai,au=[new k(-Ai,Qi,0),new k(Ai,Qi,0),new k(-Qi,0,Ai),new k(Qi,0,Ai),new k(0,Ai,-Qi),new k(0,Ai,Qi),new k(-1,1,-1),new k(1,1,-1),new k(-1,1,1),new k(1,1,1)];class lu{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,i=.1,r=100){sa=this._renderer.getRenderTarget(),oa=this._renderer.getActiveCubeFace(),aa=this._renderer.getActiveMipmapLevel(),la=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);const s=this._allocateTargets();return s.depthBuffer=!0,this._sceneToCubeUV(t,i,r,s),e>0&&this._blur(s,0,0,e),this._applyPMREM(s),this._cleanup(s),s}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=hu(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=uu(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(sa,oa,aa),this._renderer.xr.enabled=la,t.scissorTest=!1,Fs(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===mr||t.mapping===_r?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),sa=this._renderer.getRenderTarget(),oa=this._renderer.getActiveCubeFace(),aa=this._renderer.getActiveMipmapLevel(),la=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const i=e||this._allocateTargets();return this._textureToCubeUV(t,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,i={magFilter:Tn,minFilter:Tn,generateMipmaps:!1,type:is,format:gn,colorSpace:xr,depthBuffer:!1},r=cu(t,e,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=cu(t,e,i);const{_lodMax:s}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=A0(s)),this._blurMaterial=w0(s,t,e)}return r}_compileMaterial(t){const e=new kn(this._lodPlanes[0],t);this._renderer.compile(e,ra)}_sceneToCubeUV(t,e,i,r){const a=new an(90,1,e,i),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],u=this._renderer,h=u.autoClear,d=u.toneMapping;u.getClearColor(ou),u.toneMapping=hi,u.autoClear=!1;const p=new Zh({name:"PMREM.Background",side:We,depthWrite:!1,depthTest:!1}),x=new kn(new os,p);let S=!1;const g=t.background;g?g.isColor&&(p.color.copy(g),t.background=null,S=!0):(p.color.copy(ou),S=!0);for(let f=0;f<6;f++){const P=f%3;P===0?(a.up.set(0,l[f],0),a.lookAt(c[f],0,0)):P===1?(a.up.set(0,0,l[f]),a.lookAt(0,c[f],0)):(a.up.set(0,l[f],0),a.lookAt(0,0,c[f]));const C=this._cubeSize;Fs(r,P*C,f>2?C:0,C,C),u.setRenderTarget(r),S&&u.render(x,a),u.render(t,a)}x.geometry.dispose(),x.material.dispose(),u.toneMapping=d,u.autoClear=h,t.background=g}_textureToCubeUV(t,e){const i=this._renderer,r=t.mapping===mr||t.mapping===_r;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=hu()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=uu());const s=r?this._cubemapMaterial:this._equirectMaterial,o=new kn(this._lodPlanes[0],s),a=s.uniforms;a.envMap.value=t;const l=this._cubeSize;Fs(e,0,0,3*l,2*l),i.setRenderTarget(e),i.render(o,ra)}_applyPMREM(t){const e=this._renderer,i=e.autoClear;e.autoClear=!1;const r=this._lodPlanes.length;for(let s=1;s<r;s++){const o=Math.sqrt(this._sigmas[s]*this._sigmas[s]-this._sigmas[s-1]*this._sigmas[s-1]),a=au[(r-s-1)%au.length];this._blur(t,s-1,s,o,a)}e.autoClear=i}_blur(t,e,i,r,s){const o=this._pingPongRenderTarget;this._halfBlur(t,o,e,i,r,"latitudinal",s),this._halfBlur(o,t,i,i,r,"longitudinal",s)}_halfBlur(t,e,i,r,s,o,a){const l=this._renderer,c=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const u=3,h=new kn(this._lodPlanes[r],c),d=c.uniforms,p=this._sizeLods[i]-1,x=isFinite(s)?Math.PI/(2*p):2*Math.PI/(2*Ri-1),S=s/x,g=isFinite(s)?1+Math.floor(u*S):Ri;g>Ri&&console.warn(`sigmaRadians, ${s}, is too large and will clip, as it requested ${g} samples when the maximum is set to ${Ri}`);const f=[];let P=0;for(let L=0;L<Ri;++L){const V=L/S,w=Math.exp(-V*V/2);f.push(w),L===0?P+=w:L<g&&(P+=2*w)}for(let L=0;L<f.length;L++)f[L]=f[L]/P;d.envMap.value=t.texture,d.samples.value=g,d.weights.value=f,d.latitudinal.value=o==="latitudinal",a&&(d.poleAxis.value=a);const{_lodMax:C}=this;d.dTheta.value=x,d.mipInt.value=C-i;const b=this._sizeLods[r],O=3*b*(r>C-rr?r-C+rr:0),F=4*(this._cubeSize-b);Fs(e,O,F,3*b,2*b),l.setRenderTarget(e),l.render(h,ra)}}function A0(n){const t=[],e=[],i=[];let r=n;const s=n-rr+1+su.length;for(let o=0;o<s;o++){const a=Math.pow(2,r);e.push(a);let l=1/a;o>n-rr?l=su[o-n+rr-1]:o===0&&(l=0),i.push(l);const c=1/(a-2),u=-c,h=1+c,d=[u,u,h,u,h,h,u,u,h,h,u,h],p=6,x=6,S=3,g=2,f=1,P=new Float32Array(S*x*p),C=new Float32Array(g*x*p),b=new Float32Array(f*x*p);for(let F=0;F<p;F++){const L=F%3*2/3-1,V=F>2?0:-1,w=[L,V,0,L+2/3,V,0,L+2/3,V+1,0,L,V,0,L+2/3,V+1,0,L,V+1,0];P.set(w,S*x*F),C.set(d,g*x*F);const T=[F,F,F,F,F,F];b.set(T,f*x*F)}const O=new tn;O.setAttribute("position",new wn(P,S)),O.setAttribute("uv",new wn(C,g)),O.setAttribute("faceIndex",new wn(b,f)),t.push(O),r>rr&&r--}return{lodPlanes:t,sizeLods:e,sigmas:i}}function cu(n,t,e){const i=new Ui(n,t,e);return i.texture.mapping=mo,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function Fs(n,t,e,i,r){n.viewport.set(t,e,i,r),n.scissor.set(t,e,i,r)}function w0(n,t,e){const i=new Float32Array(Ri),r=new k(0,1,0);return new Yn({name:"SphericalGaussianBlur",defines:{n:Ri,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:r}},vertexShader:kl(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:ui,depthTest:!1,depthWrite:!1})}function uu(){return new Yn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:kl(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:ui,depthTest:!1,depthWrite:!1})}function hu(){return new Yn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:kl(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:ui,depthTest:!1,depthWrite:!1})}function kl(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function R0(n){let t=new WeakMap,e=null;function i(a){if(a&&a.isTexture){const l=a.mapping,c=l===La||l===Ia,u=l===mr||l===_r;if(c||u){let h=t.get(a);const d=h!==void 0?h.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==d)return e===null&&(e=new lu(n)),h=c?e.fromEquirectangular(a,h):e.fromCubemap(a,h),h.texture.pmremVersion=a.pmremVersion,t.set(a,h),h.texture;if(h!==void 0)return h.texture;{const p=a.image;return c&&p&&p.height>0||u&&p&&r(p)?(e===null&&(e=new lu(n)),h=c?e.fromEquirectangular(a):e.fromCubemap(a),h.texture.pmremVersion=a.pmremVersion,t.set(a,h),a.addEventListener("dispose",s),h.texture):null}}}return a}function r(a){let l=0;const c=6;for(let u=0;u<c;u++)a[u]!==void 0&&l++;return l===c}function s(a){const l=a.target;l.removeEventListener("dispose",s);const c=t.get(l);c!==void 0&&(t.delete(l),c.dispose())}function o(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:i,dispose:o}}function C0(n){const t={};function e(i){if(t[i]!==void 0)return t[i];let r;switch(i){case"WEBGL_depth_texture":r=n.getExtension("WEBGL_depth_texture")||n.getExtension("MOZ_WEBGL_depth_texture")||n.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":r=n.getExtension("EXT_texture_filter_anisotropic")||n.getExtension("MOZ_EXT_texture_filter_anisotropic")||n.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":r=n.getExtension("WEBGL_compressed_texture_s3tc")||n.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":r=n.getExtension("WEBGL_compressed_texture_pvrtc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:r=n.getExtension(i)}return t[i]=r,r}return{has:function(i){return e(i)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(i){const r=e(i);return r===null&&nr("THREE.WebGLRenderer: "+i+" extension not supported."),r}}}function P0(n,t,e,i){const r={},s=new WeakMap;function o(h){const d=h.target;d.index!==null&&t.remove(d.index);for(const x in d.attributes)t.remove(d.attributes[x]);d.removeEventListener("dispose",o),delete r[d.id];const p=s.get(d);p&&(t.remove(p),s.delete(d)),i.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,e.memory.geometries--}function a(h,d){return r[d.id]===!0||(d.addEventListener("dispose",o),r[d.id]=!0,e.memory.geometries++),d}function l(h){const d=h.attributes;for(const p in d)t.update(d[p],n.ARRAY_BUFFER)}function c(h){const d=[],p=h.index,x=h.attributes.position;let S=0;if(p!==null){const P=p.array;S=p.version;for(let C=0,b=P.length;C<b;C+=3){const O=P[C+0],F=P[C+1],L=P[C+2];d.push(O,F,F,L,L,O)}}else if(x!==void 0){const P=x.array;S=x.version;for(let C=0,b=P.length/3-1;C<b;C+=3){const O=C+0,F=C+1,L=C+2;d.push(O,F,F,L,L,O)}}else return;const g=new(qh(d)?Qh:Jh)(d,1);g.version=S;const f=s.get(h);f&&t.remove(f),s.set(h,g)}function u(h){const d=s.get(h);if(d){const p=h.index;p!==null&&d.version<p.version&&c(h)}else c(h);return s.get(h)}return{get:a,update:l,getWireframeAttribute:u}}function D0(n,t,e){let i;function r(d){i=d}let s,o;function a(d){s=d.type,o=d.bytesPerElement}function l(d,p){n.drawElements(i,p,s,d*o),e.update(p,i,1)}function c(d,p,x){x!==0&&(n.drawElementsInstanced(i,p,s,d*o,x),e.update(p,i,x))}function u(d,p,x){if(x===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,p,0,s,d,0,x);let g=0;for(let f=0;f<x;f++)g+=p[f];e.update(g,i,1)}function h(d,p,x,S){if(x===0)return;const g=t.get("WEBGL_multi_draw");if(g===null)for(let f=0;f<d.length;f++)c(d[f]/o,p[f],S[f]);else{g.multiDrawElementsInstancedWEBGL(i,p,0,s,d,0,S,0,x);let f=0;for(let P=0;P<x;P++)f+=p[P]*S[P];e.update(f,i,1)}}this.setMode=r,this.setIndex=a,this.render=l,this.renderInstances=c,this.renderMultiDraw=u,this.renderMultiDrawInstances=h}function L0(n){const t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function i(s,o,a){switch(e.calls++,o){case n.TRIANGLES:e.triangles+=a*(s/3);break;case n.LINES:e.lines+=a*(s/2);break;case n.LINE_STRIP:e.lines+=a*(s-1);break;case n.LINE_LOOP:e.lines+=a*s;break;case n.POINTS:e.points+=a*s;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function r(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:r,update:i}}function I0(n,t,e){const i=new WeakMap,r=new ve;function s(o,a,l){const c=o.morphTargetInfluences,u=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,h=u!==void 0?u.length:0;let d=i.get(a);if(d===void 0||d.count!==h){let T=function(){V.dispose(),i.delete(a),a.removeEventListener("dispose",T)};var p=T;d!==void 0&&d.texture.dispose();const x=a.morphAttributes.position!==void 0,S=a.morphAttributes.normal!==void 0,g=a.morphAttributes.color!==void 0,f=a.morphAttributes.position||[],P=a.morphAttributes.normal||[],C=a.morphAttributes.color||[];let b=0;x===!0&&(b=1),S===!0&&(b=2),g===!0&&(b=3);let O=a.attributes.position.count*b,F=1;O>t.maxTextureSize&&(F=Math.ceil(O/t.maxTextureSize),O=t.maxTextureSize);const L=new Float32Array(O*F*4*h),V=new jh(L,O,F,h);V.type=Vn,V.needsUpdate=!0;const w=b*4;for(let U=0;U<h;U++){const rt=f[U],Z=P[U],ot=C[U],at=O*F*4*U;for(let et=0;et<rt.count;et++){const nt=et*w;x===!0&&(r.fromBufferAttribute(rt,et),L[at+nt+0]=r.x,L[at+nt+1]=r.y,L[at+nt+2]=r.z,L[at+nt+3]=0),S===!0&&(r.fromBufferAttribute(Z,et),L[at+nt+4]=r.x,L[at+nt+5]=r.y,L[at+nt+6]=r.z,L[at+nt+7]=0),g===!0&&(r.fromBufferAttribute(ot,et),L[at+nt+8]=r.x,L[at+nt+9]=r.y,L[at+nt+10]=r.z,L[at+nt+11]=ot.itemSize===4?r.w:1)}}d={count:h,texture:V,size:new Yt(O,F)},i.set(a,d),a.addEventListener("dispose",T)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)l.getUniforms().setValue(n,"morphTexture",o.morphTexture,e);else{let x=0;for(let g=0;g<c.length;g++)x+=c[g];const S=a.morphTargetsRelative?1:1-x;l.getUniforms().setValue(n,"morphTargetBaseInfluence",S),l.getUniforms().setValue(n,"morphTargetInfluences",c)}l.getUniforms().setValue(n,"morphTargetsTexture",d.texture,e),l.getUniforms().setValue(n,"morphTargetsTextureSize",d.size)}return{update:s}}function U0(n,t,e,i){let r=new WeakMap;function s(l){const c=i.render.frame,u=l.geometry,h=t.get(l,u);if(r.get(h)!==c&&(t.update(h),r.set(h,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",a)===!1&&l.addEventListener("dispose",a),r.get(l)!==c&&(e.update(l.instanceMatrix,n.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,n.ARRAY_BUFFER),r.set(l,c))),l.isSkinnedMesh){const d=l.skeleton;r.get(d)!==c&&(d.update(),r.set(d,c))}return h}function o(){r=new WeakMap}function a(l){const c=l.target;c.removeEventListener("dispose",a),e.remove(c.instanceMatrix),c.instanceColor!==null&&e.remove(c.instanceColor)}return{update:s,dispose:o}}const cf=new Xe,fu=new af(1,1),uf=new jh,hf=new f_,ff=new nf,du=[],pu=[],mu=new Float32Array(16),_u=new Float32Array(9),gu=new Float32Array(4);function Tr(n,t,e){const i=n[0];if(i<=0||i>0)return n;const r=t*e;let s=du[r];if(s===void 0&&(s=new Float32Array(r),du[r]=s),t!==0){i.toArray(s,0);for(let o=1,a=0;o!==t;++o)a+=e,n[o].toArray(s,a)}return s}function Te(n,t){if(n.length!==t.length)return!1;for(let e=0,i=n.length;e<i;e++)if(n[e]!==t[e])return!1;return!0}function be(n,t){for(let e=0,i=t.length;e<i;e++)n[e]=t[e]}function vo(n,t){let e=pu[t];e===void 0&&(e=new Int32Array(t),pu[t]=e);for(let i=0;i!==t;++i)e[i]=n.allocateTextureUnit();return e}function N0(n,t){const e=this.cache;e[0]!==t&&(n.uniform1f(this.addr,t),e[0]=t)}function F0(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(n.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Te(e,t))return;n.uniform2fv(this.addr,t),be(e,t)}}function O0(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(n.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(n.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(Te(e,t))return;n.uniform3fv(this.addr,t),be(e,t)}}function B0(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(n.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Te(e,t))return;n.uniform4fv(this.addr,t),be(e,t)}}function z0(n,t){const e=this.cache,i=t.elements;if(i===void 0){if(Te(e,t))return;n.uniformMatrix2fv(this.addr,!1,t),be(e,t)}else{if(Te(e,i))return;gu.set(i),n.uniformMatrix2fv(this.addr,!1,gu),be(e,i)}}function H0(n,t){const e=this.cache,i=t.elements;if(i===void 0){if(Te(e,t))return;n.uniformMatrix3fv(this.addr,!1,t),be(e,t)}else{if(Te(e,i))return;_u.set(i),n.uniformMatrix3fv(this.addr,!1,_u),be(e,i)}}function V0(n,t){const e=this.cache,i=t.elements;if(i===void 0){if(Te(e,t))return;n.uniformMatrix4fv(this.addr,!1,t),be(e,t)}else{if(Te(e,i))return;mu.set(i),n.uniformMatrix4fv(this.addr,!1,mu),be(e,i)}}function G0(n,t){const e=this.cache;e[0]!==t&&(n.uniform1i(this.addr,t),e[0]=t)}function k0(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(n.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Te(e,t))return;n.uniform2iv(this.addr,t),be(e,t)}}function W0(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(n.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Te(e,t))return;n.uniform3iv(this.addr,t),be(e,t)}}function X0(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(n.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Te(e,t))return;n.uniform4iv(this.addr,t),be(e,t)}}function q0(n,t){const e=this.cache;e[0]!==t&&(n.uniform1ui(this.addr,t),e[0]=t)}function Y0(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(n.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Te(e,t))return;n.uniform2uiv(this.addr,t),be(e,t)}}function j0(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(n.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Te(e,t))return;n.uniform3uiv(this.addr,t),be(e,t)}}function K0(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(n.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Te(e,t))return;n.uniform4uiv(this.addr,t),be(e,t)}}function $0(n,t,e){const i=this.cache,r=e.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r);let s;this.type===n.SAMPLER_2D_SHADOW?(fu.compareFunction=Xh,s=fu):s=cf,e.setTexture2D(t||s,r)}function Z0(n,t,e){const i=this.cache,r=e.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),e.setTexture3D(t||hf,r)}function J0(n,t,e){const i=this.cache,r=e.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),e.setTextureCube(t||ff,r)}function Q0(n,t,e){const i=this.cache,r=e.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),e.setTexture2DArray(t||uf,r)}function tx(n){switch(n){case 5126:return N0;case 35664:return F0;case 35665:return O0;case 35666:return B0;case 35674:return z0;case 35675:return H0;case 35676:return V0;case 5124:case 35670:return G0;case 35667:case 35671:return k0;case 35668:case 35672:return W0;case 35669:case 35673:return X0;case 5125:return q0;case 36294:return Y0;case 36295:return j0;case 36296:return K0;case 35678:case 36198:case 36298:case 36306:case 35682:return $0;case 35679:case 36299:case 36307:return Z0;case 35680:case 36300:case 36308:case 36293:return J0;case 36289:case 36303:case 36311:case 36292:return Q0}}function ex(n,t){n.uniform1fv(this.addr,t)}function nx(n,t){const e=Tr(t,this.size,2);n.uniform2fv(this.addr,e)}function ix(n,t){const e=Tr(t,this.size,3);n.uniform3fv(this.addr,e)}function rx(n,t){const e=Tr(t,this.size,4);n.uniform4fv(this.addr,e)}function sx(n,t){const e=Tr(t,this.size,4);n.uniformMatrix2fv(this.addr,!1,e)}function ox(n,t){const e=Tr(t,this.size,9);n.uniformMatrix3fv(this.addr,!1,e)}function ax(n,t){const e=Tr(t,this.size,16);n.uniformMatrix4fv(this.addr,!1,e)}function lx(n,t){n.uniform1iv(this.addr,t)}function cx(n,t){n.uniform2iv(this.addr,t)}function ux(n,t){n.uniform3iv(this.addr,t)}function hx(n,t){n.uniform4iv(this.addr,t)}function fx(n,t){n.uniform1uiv(this.addr,t)}function dx(n,t){n.uniform2uiv(this.addr,t)}function px(n,t){n.uniform3uiv(this.addr,t)}function mx(n,t){n.uniform4uiv(this.addr,t)}function _x(n,t,e){const i=this.cache,r=t.length,s=vo(e,r);Te(i,s)||(n.uniform1iv(this.addr,s),be(i,s));for(let o=0;o!==r;++o)e.setTexture2D(t[o]||cf,s[o])}function gx(n,t,e){const i=this.cache,r=t.length,s=vo(e,r);Te(i,s)||(n.uniform1iv(this.addr,s),be(i,s));for(let o=0;o!==r;++o)e.setTexture3D(t[o]||hf,s[o])}function vx(n,t,e){const i=this.cache,r=t.length,s=vo(e,r);Te(i,s)||(n.uniform1iv(this.addr,s),be(i,s));for(let o=0;o!==r;++o)e.setTextureCube(t[o]||ff,s[o])}function xx(n,t,e){const i=this.cache,r=t.length,s=vo(e,r);Te(i,s)||(n.uniform1iv(this.addr,s),be(i,s));for(let o=0;o!==r;++o)e.setTexture2DArray(t[o]||uf,s[o])}function Mx(n){switch(n){case 5126:return ex;case 35664:return nx;case 35665:return ix;case 35666:return rx;case 35674:return sx;case 35675:return ox;case 35676:return ax;case 5124:case 35670:return lx;case 35667:case 35671:return cx;case 35668:case 35672:return ux;case 35669:case 35673:return hx;case 5125:return fx;case 36294:return dx;case 36295:return px;case 36296:return mx;case 35678:case 36198:case 36298:case 36306:case 35682:return _x;case 35679:case 36299:case 36307:return gx;case 35680:case 36300:case 36308:case 36293:return vx;case 36289:case 36303:case 36311:case 36292:return xx}}class Sx{constructor(t,e,i){this.id=t,this.addr=i,this.cache=[],this.type=e.type,this.setValue=tx(e.type)}}class Ex{constructor(t,e,i){this.id=t,this.addr=i,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=Mx(e.type)}}class yx{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,i){const r=this.seq;for(let s=0,o=r.length;s!==o;++s){const a=r[s];a.setValue(t,e[a.id],i)}}}const ca=/(\w+)(\])?(\[|\.)?/g;function vu(n,t){n.seq.push(t),n.map[t.id]=t}function Tx(n,t,e){const i=n.name,r=i.length;for(ca.lastIndex=0;;){const s=ca.exec(i),o=ca.lastIndex;let a=s[1];const l=s[2]==="]",c=s[3];if(l&&(a=a|0),c===void 0||c==="["&&o+2===r){vu(e,c===void 0?new Sx(a,n,t):new Ex(a,n,t));break}else{let h=e.map[a];h===void 0&&(h=new yx(a),vu(e,h)),e=h}}}class Ys{constructor(t,e){this.seq=[],this.map={};const i=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let r=0;r<i;++r){const s=t.getActiveUniform(e,r),o=t.getUniformLocation(e,s.name);Tx(s,o,this)}}setValue(t,e,i,r){const s=this.map[e];s!==void 0&&s.setValue(t,i,r)}setOptional(t,e,i){const r=e[i];r!==void 0&&this.setValue(t,i,r)}static upload(t,e,i,r){for(let s=0,o=e.length;s!==o;++s){const a=e[s],l=i[a.id];l.needsUpdate!==!1&&a.setValue(t,l.value,r)}}static seqWithValue(t,e){const i=[];for(let r=0,s=t.length;r!==s;++r){const o=t[r];o.id in e&&i.push(o)}return i}}function xu(n,t,e){const i=n.createShader(t);return n.shaderSource(i,e),n.compileShader(i),i}const bx=37297;let Ax=0;function wx(n,t){const e=n.split(`
`),i=[],r=Math.max(t-6,0),s=Math.min(t+6,e.length);for(let o=r;o<s;o++){const a=o+1;i.push(`${a===t?">":" "} ${a}: ${e[o]}`)}return i.join(`
`)}const Mu=new Gt;function Rx(n){Qt._getMatrix(Mu,Qt.workingColorSpace,n);const t=`mat3( ${Mu.elements.map(e=>e.toFixed(4))} )`;switch(Qt.getTransfer(n)){case to:return[t,"LinearTransferOETF"];case oe:return[t,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",n),[t,"LinearTransferOETF"]}}function Su(n,t,e){const i=n.getShaderParameter(t,n.COMPILE_STATUS),r=n.getShaderInfoLog(t).trim();if(i&&r==="")return"";const s=/ERROR: 0:(\d+)/.exec(r);if(s){const o=parseInt(s[1]);return e.toUpperCase()+`

`+r+`

`+wx(n.getShaderSource(t),o)}else return r}function Cx(n,t){const e=Rx(t);return[`vec4 ${n}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}function Px(n,t){let e;switch(t){case Sm:e="Linear";break;case Em:e="Reinhard";break;case ym:e="Cineon";break;case Tm:e="ACESFilmic";break;case Am:e="AgX";break;case wm:e="Neutral";break;case bm:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+n+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}const Os=new k;function Dx(){Qt.getLuminanceCoefficients(Os);const n=Os.x.toFixed(4),t=Os.y.toFixed(4),e=Os.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${n}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Lx(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",n.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Ur).join(`
`)}function Ix(n){const t=[];for(const e in n){const i=n[e];i!==!1&&t.push("#define "+e+" "+i)}return t.join(`
`)}function Ux(n,t){const e={},i=n.getProgramParameter(t,n.ACTIVE_ATTRIBUTES);for(let r=0;r<i;r++){const s=n.getActiveAttrib(t,r),o=s.name;let a=1;s.type===n.FLOAT_MAT2&&(a=2),s.type===n.FLOAT_MAT3&&(a=3),s.type===n.FLOAT_MAT4&&(a=4),e[o]={type:s.type,location:n.getAttribLocation(t,o),locationSize:a}}return e}function Ur(n){return n!==""}function Eu(n,t){const e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return n.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function yu(n,t){return n.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const Nx=/^[ \t]*#include +<([\w\d./]+)>/gm;function cl(n){return n.replace(Nx,Ox)}const Fx=new Map;function Ox(n,t){let e=kt[t];if(e===void 0){const i=Fx.get(t);if(i!==void 0)e=kt[i],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,i);else throw new Error("Can not resolve #include <"+t+">")}return cl(e)}const Bx=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Tu(n){return n.replace(Bx,zx)}function zx(n,t,e,i){let r="";for(let s=parseInt(t);s<parseInt(e);s++)r+=i.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return r}function bu(n){let t=`precision ${n.precision} float;
	precision ${n.precision} int;
	precision ${n.precision} sampler2D;
	precision ${n.precision} samplerCube;
	precision ${n.precision} sampler3D;
	precision ${n.precision} sampler2DArray;
	precision ${n.precision} sampler2DShadow;
	precision ${n.precision} samplerCubeShadow;
	precision ${n.precision} sampler2DArrayShadow;
	precision ${n.precision} isampler2D;
	precision ${n.precision} isampler3D;
	precision ${n.precision} isamplerCube;
	precision ${n.precision} isampler2DArray;
	precision ${n.precision} usampler2D;
	precision ${n.precision} usampler3D;
	precision ${n.precision} usamplerCube;
	precision ${n.precision} usampler2DArray;
	`;return n.precision==="highp"?t+=`
#define HIGH_PRECISION`:n.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:n.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}function Hx(n){let t="SHADOWMAP_TYPE_BASIC";return n.shadowMapType===Lh?t="SHADOWMAP_TYPE_PCF":n.shadowMapType===tm?t="SHADOWMAP_TYPE_PCF_SOFT":n.shadowMapType===Fn&&(t="SHADOWMAP_TYPE_VSM"),t}function Vx(n){let t="ENVMAP_TYPE_CUBE";if(n.envMap)switch(n.envMapMode){case mr:case _r:t="ENVMAP_TYPE_CUBE";break;case mo:t="ENVMAP_TYPE_CUBE_UV";break}return t}function Gx(n){let t="ENVMAP_MODE_REFLECTION";if(n.envMap)switch(n.envMapMode){case _r:t="ENVMAP_MODE_REFRACTION";break}return t}function kx(n){let t="ENVMAP_BLENDING_NONE";if(n.envMap)switch(n.combine){case Ih:t="ENVMAP_BLENDING_MULTIPLY";break;case xm:t="ENVMAP_BLENDING_MIX";break;case Mm:t="ENVMAP_BLENDING_ADD";break}return t}function Wx(n){const t=n.envMapCubeUVHeight;if(t===null)return null;const e=Math.log2(t)-2,i=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),7*16)),texelHeight:i,maxMip:e}}function Xx(n,t,e,i){const r=n.getContext(),s=e.defines;let o=e.vertexShader,a=e.fragmentShader;const l=Hx(e),c=Vx(e),u=Gx(e),h=kx(e),d=Wx(e),p=Lx(e),x=Ix(s),S=r.createProgram();let g,f,P=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(g=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,x].filter(Ur).join(`
`),g.length>0&&(g+=`
`),f=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,x].filter(Ur).join(`
`),f.length>0&&(f+=`
`)):(g=[bu(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,x,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+u:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Ur).join(`
`),f=[bu(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,x,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+u:"",e.envMap?"#define "+h:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor||e.batchingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==hi?"#define TONE_MAPPING":"",e.toneMapping!==hi?kt.tonemapping_pars_fragment:"",e.toneMapping!==hi?Px("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",kt.colorspace_pars_fragment,Cx("linearToOutputTexel",e.outputColorSpace),Dx(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(Ur).join(`
`)),o=cl(o),o=Eu(o,e),o=yu(o,e),a=cl(a),a=Eu(a,e),a=yu(a,e),o=Tu(o),a=Tu(a),e.isRawShaderMaterial!==!0&&(P=`#version 300 es
`,g=[p,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+g,f=["#define varying in",e.glslVersion===Uc?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===Uc?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+f);const C=P+g+o,b=P+f+a,O=xu(r,r.VERTEX_SHADER,C),F=xu(r,r.FRAGMENT_SHADER,b);r.attachShader(S,O),r.attachShader(S,F),e.index0AttributeName!==void 0?r.bindAttribLocation(S,0,e.index0AttributeName):e.morphTargets===!0&&r.bindAttribLocation(S,0,"position"),r.linkProgram(S);function L(U){if(n.debug.checkShaderErrors){const rt=r.getProgramInfoLog(S).trim(),Z=r.getShaderInfoLog(O).trim(),ot=r.getShaderInfoLog(F).trim();let at=!0,et=!0;if(r.getProgramParameter(S,r.LINK_STATUS)===!1)if(at=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(r,S,O,F);else{const nt=Su(r,O,"vertex"),G=Su(r,F,"fragment");console.error("THREE.WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(S,r.VALIDATE_STATUS)+`

Material Name: `+U.name+`
Material Type: `+U.type+`

Program Info Log: `+rt+`
`+nt+`
`+G)}else rt!==""?console.warn("THREE.WebGLProgram: Program Info Log:",rt):(Z===""||ot==="")&&(et=!1);et&&(U.diagnostics={runnable:at,programLog:rt,vertexShader:{log:Z,prefix:g},fragmentShader:{log:ot,prefix:f}})}r.deleteShader(O),r.deleteShader(F),V=new Ys(r,S),w=Ux(r,S)}let V;this.getUniforms=function(){return V===void 0&&L(this),V};let w;this.getAttributes=function(){return w===void 0&&L(this),w};let T=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return T===!1&&(T=r.getProgramParameter(S,bx)),T},this.destroy=function(){i.releaseStatesOfProgram(this),r.deleteProgram(S),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=Ax++,this.cacheKey=t,this.usedTimes=1,this.program=S,this.vertexShader=O,this.fragmentShader=F,this}let qx=0;class Yx{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){const e=t.vertexShader,i=t.fragmentShader,r=this._getShaderStage(e),s=this._getShaderStage(i),o=this._getShaderCacheForMaterial(t);return o.has(r)===!1&&(o.add(r),r.usedTimes++),o.has(s)===!1&&(o.add(s),s.usedTimes++),this}remove(t){const e=this.materialCache.get(t);for(const i of e)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const e=this.materialCache;let i=e.get(t);return i===void 0&&(i=new Set,e.set(t,i)),i}_getShaderStage(t){const e=this.shaderCache;let i=e.get(t);return i===void 0&&(i=new jx(t),e.set(t,i)),i}}class jx{constructor(t){this.id=qx++,this.code=t,this.usedTimes=0}}function Kx(n,t,e,i,r,s,o){const a=new Kh,l=new Yx,c=new Set,u=[],h=r.logarithmicDepthBuffer,d=r.vertexTextures;let p=r.precision;const x={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function S(w){return c.add(w),w===0?"uv":`uv${w}`}function g(w,T,U,rt,Z){const ot=rt.fog,at=Z.geometry,et=w.isMeshStandardMaterial?rt.environment:null,nt=(w.isMeshStandardMaterial?e:t).get(w.envMap||et),G=nt&&nt.mapping===mo?nt.image.height:null,mt=x[w.type];w.precision!==null&&(p=r.getMaxPrecision(w.precision),p!==w.precision&&console.warn("THREE.WebGLProgram.getParameters:",w.precision,"not supported, using",p,"instead."));const St=at.morphAttributes.position||at.morphAttributes.normal||at.morphAttributes.color,xt=St!==void 0?St.length:0;let Ut=0;at.morphAttributes.position!==void 0&&(Ut=1),at.morphAttributes.normal!==void 0&&(Ut=2),at.morphAttributes.color!==void 0&&(Ut=3);let Kt,it,ft,At;if(mt){const se=yn[mt];Kt=se.vertexShader,it=se.fragmentShader}else Kt=w.vertexShader,it=w.fragmentShader,l.update(w),ft=l.getVertexShaderID(w),At=l.getFragmentShaderID(w);const gt=n.getRenderTarget(),Dt=n.state.buffers.depth.getReversed(),Ft=Z.isInstancedMesh===!0,Bt=Z.isBatchedMesh===!0,Zt=!!w.map,qt=!!w.matcap,R=!!nt,v=!!w.aoMap,$=!!w.lightMap,tt=!!w.bumpMap,J=!!w.normalMap,W=!!w.displacementMap,ct=!!w.emissiveMap,Q=!!w.metalnessMap,M=!!w.roughnessMap,_=w.anisotropy>0,D=w.clearcoat>0,m=w.dispersion>0,y=w.iridescence>0,A=w.sheen>0,I=w.transmission>0,z=_&&!!w.anisotropyMap,Y=D&&!!w.clearcoatMap,ht=D&&!!w.clearcoatNormalMap,X=D&&!!w.clearcoatRoughnessMap,lt=y&&!!w.iridescenceMap,ut=y&&!!w.iridescenceThicknessMap,Et=A&&!!w.sheenColorMap,dt=A&&!!w.sheenRoughnessMap,wt=!!w.specularMap,Rt=!!w.specularColorMap,Ot=!!w.specularIntensityMap,N=I&&!!w.transmissionMap,_t=I&&!!w.thicknessMap,j=!!w.gradientMap,st=!!w.alphaMap,Mt=w.alphaTest>0,vt=!!w.alphaHash,Vt=!!w.extensions;let pe=hi;w.toneMapped&&(gt===null||gt.isXRRenderTarget===!0)&&(pe=n.toneMapping);const Ee={shaderID:mt,shaderType:w.type,shaderName:w.name,vertexShader:Kt,fragmentShader:it,defines:w.defines,customVertexShaderID:ft,customFragmentShaderID:At,isRawShaderMaterial:w.isRawShaderMaterial===!0,glslVersion:w.glslVersion,precision:p,batching:Bt,batchingColor:Bt&&Z._colorsTexture!==null,instancing:Ft,instancingColor:Ft&&Z.instanceColor!==null,instancingMorph:Ft&&Z.morphTexture!==null,supportsVertexTextures:d,outputColorSpace:gt===null?n.outputColorSpace:gt.isXRRenderTarget===!0?gt.texture.colorSpace:xr,alphaToCoverage:!!w.alphaToCoverage,map:Zt,matcap:qt,envMap:R,envMapMode:R&&nt.mapping,envMapCubeUVHeight:G,aoMap:v,lightMap:$,bumpMap:tt,normalMap:J,displacementMap:d&&W,emissiveMap:ct,normalMapObjectSpace:J&&w.normalMapType===Lm,normalMapTangentSpace:J&&w.normalMapType===Dm,metalnessMap:Q,roughnessMap:M,anisotropy:_,anisotropyMap:z,clearcoat:D,clearcoatMap:Y,clearcoatNormalMap:ht,clearcoatRoughnessMap:X,dispersion:m,iridescence:y,iridescenceMap:lt,iridescenceThicknessMap:ut,sheen:A,sheenColorMap:Et,sheenRoughnessMap:dt,specularMap:wt,specularColorMap:Rt,specularIntensityMap:Ot,transmission:I,transmissionMap:N,thicknessMap:_t,gradientMap:j,opaque:w.transparent===!1&&w.blending===cr&&w.alphaToCoverage===!1,alphaMap:st,alphaTest:Mt,alphaHash:vt,combine:w.combine,mapUv:Zt&&S(w.map.channel),aoMapUv:v&&S(w.aoMap.channel),lightMapUv:$&&S(w.lightMap.channel),bumpMapUv:tt&&S(w.bumpMap.channel),normalMapUv:J&&S(w.normalMap.channel),displacementMapUv:W&&S(w.displacementMap.channel),emissiveMapUv:ct&&S(w.emissiveMap.channel),metalnessMapUv:Q&&S(w.metalnessMap.channel),roughnessMapUv:M&&S(w.roughnessMap.channel),anisotropyMapUv:z&&S(w.anisotropyMap.channel),clearcoatMapUv:Y&&S(w.clearcoatMap.channel),clearcoatNormalMapUv:ht&&S(w.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:X&&S(w.clearcoatRoughnessMap.channel),iridescenceMapUv:lt&&S(w.iridescenceMap.channel),iridescenceThicknessMapUv:ut&&S(w.iridescenceThicknessMap.channel),sheenColorMapUv:Et&&S(w.sheenColorMap.channel),sheenRoughnessMapUv:dt&&S(w.sheenRoughnessMap.channel),specularMapUv:wt&&S(w.specularMap.channel),specularColorMapUv:Rt&&S(w.specularColorMap.channel),specularIntensityMapUv:Ot&&S(w.specularIntensityMap.channel),transmissionMapUv:N&&S(w.transmissionMap.channel),thicknessMapUv:_t&&S(w.thicknessMap.channel),alphaMapUv:st&&S(w.alphaMap.channel),vertexTangents:!!at.attributes.tangent&&(J||_),vertexColors:w.vertexColors,vertexAlphas:w.vertexColors===!0&&!!at.attributes.color&&at.attributes.color.itemSize===4,pointsUvs:Z.isPoints===!0&&!!at.attributes.uv&&(Zt||st),fog:!!ot,useFog:w.fog===!0,fogExp2:!!ot&&ot.isFogExp2,flatShading:w.flatShading===!0,sizeAttenuation:w.sizeAttenuation===!0,logarithmicDepthBuffer:h,reverseDepthBuffer:Dt,skinning:Z.isSkinnedMesh===!0,morphTargets:at.morphAttributes.position!==void 0,morphNormals:at.morphAttributes.normal!==void 0,morphColors:at.morphAttributes.color!==void 0,morphTargetsCount:xt,morphTextureStride:Ut,numDirLights:T.directional.length,numPointLights:T.point.length,numSpotLights:T.spot.length,numSpotLightMaps:T.spotLightMap.length,numRectAreaLights:T.rectArea.length,numHemiLights:T.hemi.length,numDirLightShadows:T.directionalShadowMap.length,numPointLightShadows:T.pointShadowMap.length,numSpotLightShadows:T.spotShadowMap.length,numSpotLightShadowsWithMaps:T.numSpotLightShadowsWithMaps,numLightProbes:T.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:w.dithering,shadowMapEnabled:n.shadowMap.enabled&&U.length>0,shadowMapType:n.shadowMap.type,toneMapping:pe,decodeVideoTexture:Zt&&w.map.isVideoTexture===!0&&Qt.getTransfer(w.map.colorSpace)===oe,decodeVideoTextureEmissive:ct&&w.emissiveMap.isVideoTexture===!0&&Qt.getTransfer(w.emissiveMap.colorSpace)===oe,premultipliedAlpha:w.premultipliedAlpha,doubleSided:w.side===Hn,flipSided:w.side===We,useDepthPacking:w.depthPacking>=0,depthPacking:w.depthPacking||0,index0AttributeName:w.index0AttributeName,extensionClipCullDistance:Vt&&w.extensions.clipCullDistance===!0&&i.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Vt&&w.extensions.multiDraw===!0||Bt)&&i.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:i.has("KHR_parallel_shader_compile"),customProgramCacheKey:w.customProgramCacheKey()};return Ee.vertexUv1s=c.has(1),Ee.vertexUv2s=c.has(2),Ee.vertexUv3s=c.has(3),c.clear(),Ee}function f(w){const T=[];if(w.shaderID?T.push(w.shaderID):(T.push(w.customVertexShaderID),T.push(w.customFragmentShaderID)),w.defines!==void 0)for(const U in w.defines)T.push(U),T.push(w.defines[U]);return w.isRawShaderMaterial===!1&&(P(T,w),C(T,w),T.push(n.outputColorSpace)),T.push(w.customProgramCacheKey),T.join()}function P(w,T){w.push(T.precision),w.push(T.outputColorSpace),w.push(T.envMapMode),w.push(T.envMapCubeUVHeight),w.push(T.mapUv),w.push(T.alphaMapUv),w.push(T.lightMapUv),w.push(T.aoMapUv),w.push(T.bumpMapUv),w.push(T.normalMapUv),w.push(T.displacementMapUv),w.push(T.emissiveMapUv),w.push(T.metalnessMapUv),w.push(T.roughnessMapUv),w.push(T.anisotropyMapUv),w.push(T.clearcoatMapUv),w.push(T.clearcoatNormalMapUv),w.push(T.clearcoatRoughnessMapUv),w.push(T.iridescenceMapUv),w.push(T.iridescenceThicknessMapUv),w.push(T.sheenColorMapUv),w.push(T.sheenRoughnessMapUv),w.push(T.specularMapUv),w.push(T.specularColorMapUv),w.push(T.specularIntensityMapUv),w.push(T.transmissionMapUv),w.push(T.thicknessMapUv),w.push(T.combine),w.push(T.fogExp2),w.push(T.sizeAttenuation),w.push(T.morphTargetsCount),w.push(T.morphAttributeCount),w.push(T.numDirLights),w.push(T.numPointLights),w.push(T.numSpotLights),w.push(T.numSpotLightMaps),w.push(T.numHemiLights),w.push(T.numRectAreaLights),w.push(T.numDirLightShadows),w.push(T.numPointLightShadows),w.push(T.numSpotLightShadows),w.push(T.numSpotLightShadowsWithMaps),w.push(T.numLightProbes),w.push(T.shadowMapType),w.push(T.toneMapping),w.push(T.numClippingPlanes),w.push(T.numClipIntersection),w.push(T.depthPacking)}function C(w,T){a.disableAll(),T.supportsVertexTextures&&a.enable(0),T.instancing&&a.enable(1),T.instancingColor&&a.enable(2),T.instancingMorph&&a.enable(3),T.matcap&&a.enable(4),T.envMap&&a.enable(5),T.normalMapObjectSpace&&a.enable(6),T.normalMapTangentSpace&&a.enable(7),T.clearcoat&&a.enable(8),T.iridescence&&a.enable(9),T.alphaTest&&a.enable(10),T.vertexColors&&a.enable(11),T.vertexAlphas&&a.enable(12),T.vertexUv1s&&a.enable(13),T.vertexUv2s&&a.enable(14),T.vertexUv3s&&a.enable(15),T.vertexTangents&&a.enable(16),T.anisotropy&&a.enable(17),T.alphaHash&&a.enable(18),T.batching&&a.enable(19),T.dispersion&&a.enable(20),T.batchingColor&&a.enable(21),w.push(a.mask),a.disableAll(),T.fog&&a.enable(0),T.useFog&&a.enable(1),T.flatShading&&a.enable(2),T.logarithmicDepthBuffer&&a.enable(3),T.reverseDepthBuffer&&a.enable(4),T.skinning&&a.enable(5),T.morphTargets&&a.enable(6),T.morphNormals&&a.enable(7),T.morphColors&&a.enable(8),T.premultipliedAlpha&&a.enable(9),T.shadowMapEnabled&&a.enable(10),T.doubleSided&&a.enable(11),T.flipSided&&a.enable(12),T.useDepthPacking&&a.enable(13),T.dithering&&a.enable(14),T.transmission&&a.enable(15),T.sheen&&a.enable(16),T.opaque&&a.enable(17),T.pointsUvs&&a.enable(18),T.decodeVideoTexture&&a.enable(19),T.decodeVideoTextureEmissive&&a.enable(20),T.alphaToCoverage&&a.enable(21),w.push(a.mask)}function b(w){const T=x[w.type];let U;if(T){const rt=yn[T];U=T_.clone(rt.uniforms)}else U=w.uniforms;return U}function O(w,T){let U;for(let rt=0,Z=u.length;rt<Z;rt++){const ot=u[rt];if(ot.cacheKey===T){U=ot,++U.usedTimes;break}}return U===void 0&&(U=new Xx(n,T,w,s),u.push(U)),U}function F(w){if(--w.usedTimes===0){const T=u.indexOf(w);u[T]=u[u.length-1],u.pop(),w.destroy()}}function L(w){l.remove(w)}function V(){l.dispose()}return{getParameters:g,getProgramCacheKey:f,getUniforms:b,acquireProgram:O,releaseProgram:F,releaseShaderCache:L,programs:u,dispose:V}}function $x(){let n=new WeakMap;function t(o){return n.has(o)}function e(o){let a=n.get(o);return a===void 0&&(a={},n.set(o,a)),a}function i(o){n.delete(o)}function r(o,a,l){n.get(o)[a]=l}function s(){n=new WeakMap}return{has:t,get:e,remove:i,update:r,dispose:s}}function Zx(n,t){return n.groupOrder!==t.groupOrder?n.groupOrder-t.groupOrder:n.renderOrder!==t.renderOrder?n.renderOrder-t.renderOrder:n.material.id!==t.material.id?n.material.id-t.material.id:n.z!==t.z?n.z-t.z:n.id-t.id}function Au(n,t){return n.groupOrder!==t.groupOrder?n.groupOrder-t.groupOrder:n.renderOrder!==t.renderOrder?n.renderOrder-t.renderOrder:n.z!==t.z?t.z-n.z:n.id-t.id}function wu(){const n=[];let t=0;const e=[],i=[],r=[];function s(){t=0,e.length=0,i.length=0,r.length=0}function o(h,d,p,x,S,g){let f=n[t];return f===void 0?(f={id:h.id,object:h,geometry:d,material:p,groupOrder:x,renderOrder:h.renderOrder,z:S,group:g},n[t]=f):(f.id=h.id,f.object=h,f.geometry=d,f.material=p,f.groupOrder=x,f.renderOrder=h.renderOrder,f.z=S,f.group=g),t++,f}function a(h,d,p,x,S,g){const f=o(h,d,p,x,S,g);p.transmission>0?i.push(f):p.transparent===!0?r.push(f):e.push(f)}function l(h,d,p,x,S,g){const f=o(h,d,p,x,S,g);p.transmission>0?i.unshift(f):p.transparent===!0?r.unshift(f):e.unshift(f)}function c(h,d){e.length>1&&e.sort(h||Zx),i.length>1&&i.sort(d||Au),r.length>1&&r.sort(d||Au)}function u(){for(let h=t,d=n.length;h<d;h++){const p=n[h];if(p.id===null)break;p.id=null,p.object=null,p.geometry=null,p.material=null,p.group=null}}return{opaque:e,transmissive:i,transparent:r,init:s,push:a,unshift:l,finish:u,sort:c}}function Jx(){let n=new WeakMap;function t(i,r){const s=n.get(i);let o;return s===void 0?(o=new wu,n.set(i,[o])):r>=s.length?(o=new wu,s.push(o)):o=s[r],o}function e(){n=new WeakMap}return{get:t,dispose:e}}function Qx(){const n={};return{get:function(t){if(n[t.id]!==void 0)return n[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new k,color:new ee};break;case"SpotLight":e={position:new k,direction:new k,color:new ee,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new k,color:new ee,distance:0,decay:0};break;case"HemisphereLight":e={direction:new k,skyColor:new ee,groundColor:new ee};break;case"RectAreaLight":e={color:new ee,position:new k,halfWidth:new k,halfHeight:new k};break}return n[t.id]=e,e}}}function tM(){const n={};return{get:function(t){if(n[t.id]!==void 0)return n[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Yt};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Yt};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Yt,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[t.id]=e,e}}}let eM=0;function nM(n,t){return(t.castShadow?2:0)-(n.castShadow?2:0)+(t.map?1:0)-(n.map?1:0)}function iM(n){const t=new Qx,e=tM(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)i.probe.push(new k);const r=new k,s=new ge,o=new ge;function a(c){let u=0,h=0,d=0;for(let w=0;w<9;w++)i.probe[w].set(0,0,0);let p=0,x=0,S=0,g=0,f=0,P=0,C=0,b=0,O=0,F=0,L=0;c.sort(nM);for(let w=0,T=c.length;w<T;w++){const U=c[w],rt=U.color,Z=U.intensity,ot=U.distance,at=U.shadow&&U.shadow.map?U.shadow.map.texture:null;if(U.isAmbientLight)u+=rt.r*Z,h+=rt.g*Z,d+=rt.b*Z;else if(U.isLightProbe){for(let et=0;et<9;et++)i.probe[et].addScaledVector(U.sh.coefficients[et],Z);L++}else if(U.isDirectionalLight){const et=t.get(U);if(et.color.copy(U.color).multiplyScalar(U.intensity),U.castShadow){const nt=U.shadow,G=e.get(U);G.shadowIntensity=nt.intensity,G.shadowBias=nt.bias,G.shadowNormalBias=nt.normalBias,G.shadowRadius=nt.radius,G.shadowMapSize=nt.mapSize,i.directionalShadow[p]=G,i.directionalShadowMap[p]=at,i.directionalShadowMatrix[p]=U.shadow.matrix,P++}i.directional[p]=et,p++}else if(U.isSpotLight){const et=t.get(U);et.position.setFromMatrixPosition(U.matrixWorld),et.color.copy(rt).multiplyScalar(Z),et.distance=ot,et.coneCos=Math.cos(U.angle),et.penumbraCos=Math.cos(U.angle*(1-U.penumbra)),et.decay=U.decay,i.spot[S]=et;const nt=U.shadow;if(U.map&&(i.spotLightMap[O]=U.map,O++,nt.updateMatrices(U),U.castShadow&&F++),i.spotLightMatrix[S]=nt.matrix,U.castShadow){const G=e.get(U);G.shadowIntensity=nt.intensity,G.shadowBias=nt.bias,G.shadowNormalBias=nt.normalBias,G.shadowRadius=nt.radius,G.shadowMapSize=nt.mapSize,i.spotShadow[S]=G,i.spotShadowMap[S]=at,b++}S++}else if(U.isRectAreaLight){const et=t.get(U);et.color.copy(rt).multiplyScalar(Z),et.halfWidth.set(U.width*.5,0,0),et.halfHeight.set(0,U.height*.5,0),i.rectArea[g]=et,g++}else if(U.isPointLight){const et=t.get(U);if(et.color.copy(U.color).multiplyScalar(U.intensity),et.distance=U.distance,et.decay=U.decay,U.castShadow){const nt=U.shadow,G=e.get(U);G.shadowIntensity=nt.intensity,G.shadowBias=nt.bias,G.shadowNormalBias=nt.normalBias,G.shadowRadius=nt.radius,G.shadowMapSize=nt.mapSize,G.shadowCameraNear=nt.camera.near,G.shadowCameraFar=nt.camera.far,i.pointShadow[x]=G,i.pointShadowMap[x]=at,i.pointShadowMatrix[x]=U.shadow.matrix,C++}i.point[x]=et,x++}else if(U.isHemisphereLight){const et=t.get(U);et.skyColor.copy(U.color).multiplyScalar(Z),et.groundColor.copy(U.groundColor).multiplyScalar(Z),i.hemi[f]=et,f++}}g>0&&(n.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=yt.LTC_FLOAT_1,i.rectAreaLTC2=yt.LTC_FLOAT_2):(i.rectAreaLTC1=yt.LTC_HALF_1,i.rectAreaLTC2=yt.LTC_HALF_2)),i.ambient[0]=u,i.ambient[1]=h,i.ambient[2]=d;const V=i.hash;(V.directionalLength!==p||V.pointLength!==x||V.spotLength!==S||V.rectAreaLength!==g||V.hemiLength!==f||V.numDirectionalShadows!==P||V.numPointShadows!==C||V.numSpotShadows!==b||V.numSpotMaps!==O||V.numLightProbes!==L)&&(i.directional.length=p,i.spot.length=S,i.rectArea.length=g,i.point.length=x,i.hemi.length=f,i.directionalShadow.length=P,i.directionalShadowMap.length=P,i.pointShadow.length=C,i.pointShadowMap.length=C,i.spotShadow.length=b,i.spotShadowMap.length=b,i.directionalShadowMatrix.length=P,i.pointShadowMatrix.length=C,i.spotLightMatrix.length=b+O-F,i.spotLightMap.length=O,i.numSpotLightShadowsWithMaps=F,i.numLightProbes=L,V.directionalLength=p,V.pointLength=x,V.spotLength=S,V.rectAreaLength=g,V.hemiLength=f,V.numDirectionalShadows=P,V.numPointShadows=C,V.numSpotShadows=b,V.numSpotMaps=O,V.numLightProbes=L,i.version=eM++)}function l(c,u){let h=0,d=0,p=0,x=0,S=0;const g=u.matrixWorldInverse;for(let f=0,P=c.length;f<P;f++){const C=c[f];if(C.isDirectionalLight){const b=i.directional[h];b.direction.setFromMatrixPosition(C.matrixWorld),r.setFromMatrixPosition(C.target.matrixWorld),b.direction.sub(r),b.direction.transformDirection(g),h++}else if(C.isSpotLight){const b=i.spot[p];b.position.setFromMatrixPosition(C.matrixWorld),b.position.applyMatrix4(g),b.direction.setFromMatrixPosition(C.matrixWorld),r.setFromMatrixPosition(C.target.matrixWorld),b.direction.sub(r),b.direction.transformDirection(g),p++}else if(C.isRectAreaLight){const b=i.rectArea[x];b.position.setFromMatrixPosition(C.matrixWorld),b.position.applyMatrix4(g),o.identity(),s.copy(C.matrixWorld),s.premultiply(g),o.extractRotation(s),b.halfWidth.set(C.width*.5,0,0),b.halfHeight.set(0,C.height*.5,0),b.halfWidth.applyMatrix4(o),b.halfHeight.applyMatrix4(o),x++}else if(C.isPointLight){const b=i.point[d];b.position.setFromMatrixPosition(C.matrixWorld),b.position.applyMatrix4(g),d++}else if(C.isHemisphereLight){const b=i.hemi[S];b.direction.setFromMatrixPosition(C.matrixWorld),b.direction.transformDirection(g),S++}}}return{setup:a,setupView:l,state:i}}function Ru(n){const t=new iM(n),e=[],i=[];function r(u){c.camera=u,e.length=0,i.length=0}function s(u){e.push(u)}function o(u){i.push(u)}function a(){t.setup(e)}function l(u){t.setupView(e,u)}const c={lightsArray:e,shadowsArray:i,camera:null,lights:t,transmissionRenderTarget:{}};return{init:r,state:c,setupLights:a,setupLightsView:l,pushLight:s,pushShadow:o}}function rM(n){let t=new WeakMap;function e(r,s=0){const o=t.get(r);let a;return o===void 0?(a=new Ru(n),t.set(r,[a])):s>=o.length?(a=new Ru(n),o.push(a)):a=o[s],a}function i(){t=new WeakMap}return{get:e,dispose:i}}const sM=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,oM=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function aM(n,t,e){let i=new rf;const r=new Yt,s=new Yt,o=new ve,a=new I_({depthPacking:Pm}),l=new U_,c={},u=e.maxTextureSize,h={[fi]:We,[We]:fi,[Hn]:Hn},d=new Yn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Yt},radius:{value:4}},vertexShader:sM,fragmentShader:oM}),p=d.clone();p.defines.HORIZONTAL_PASS=1;const x=new tn;x.setAttribute("position",new wn(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const S=new kn(x,d),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Lh;let f=this.type;this.render=function(F,L,V){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||F.length===0)return;const w=n.getRenderTarget(),T=n.getActiveCubeFace(),U=n.getActiveMipmapLevel(),rt=n.state;rt.setBlending(ui),rt.buffers.color.setClear(1,1,1,1),rt.buffers.depth.setTest(!0),rt.setScissorTest(!1);const Z=f!==Fn&&this.type===Fn,ot=f===Fn&&this.type!==Fn;for(let at=0,et=F.length;at<et;at++){const nt=F[at],G=nt.shadow;if(G===void 0){console.warn("THREE.WebGLShadowMap:",nt,"has no shadow.");continue}if(G.autoUpdate===!1&&G.needsUpdate===!1)continue;r.copy(G.mapSize);const mt=G.getFrameExtents();if(r.multiply(mt),s.copy(G.mapSize),(r.x>u||r.y>u)&&(r.x>u&&(s.x=Math.floor(u/mt.x),r.x=s.x*mt.x,G.mapSize.x=s.x),r.y>u&&(s.y=Math.floor(u/mt.y),r.y=s.y*mt.y,G.mapSize.y=s.y)),G.map===null||Z===!0||ot===!0){const xt=this.type!==Fn?{minFilter:xn,magFilter:xn}:{};G.map!==null&&G.map.dispose(),G.map=new Ui(r.x,r.y,xt),G.map.texture.name=nt.name+".shadowMap",G.camera.updateProjectionMatrix()}n.setRenderTarget(G.map),n.clear();const St=G.getViewportCount();for(let xt=0;xt<St;xt++){const Ut=G.getViewport(xt);o.set(s.x*Ut.x,s.y*Ut.y,s.x*Ut.z,s.y*Ut.w),rt.viewport(o),G.updateMatrices(nt,xt),i=G.getFrustum(),b(L,V,G.camera,nt,this.type)}G.isPointLightShadow!==!0&&this.type===Fn&&P(G,V),G.needsUpdate=!1}f=this.type,g.needsUpdate=!1,n.setRenderTarget(w,T,U)};function P(F,L){const V=t.update(S);d.defines.VSM_SAMPLES!==F.blurSamples&&(d.defines.VSM_SAMPLES=F.blurSamples,p.defines.VSM_SAMPLES=F.blurSamples,d.needsUpdate=!0,p.needsUpdate=!0),F.mapPass===null&&(F.mapPass=new Ui(r.x,r.y)),d.uniforms.shadow_pass.value=F.map.texture,d.uniforms.resolution.value=F.mapSize,d.uniforms.radius.value=F.radius,n.setRenderTarget(F.mapPass),n.clear(),n.renderBufferDirect(L,null,V,d,S,null),p.uniforms.shadow_pass.value=F.mapPass.texture,p.uniforms.resolution.value=F.mapSize,p.uniforms.radius.value=F.radius,n.setRenderTarget(F.map),n.clear(),n.renderBufferDirect(L,null,V,p,S,null)}function C(F,L,V,w){let T=null;const U=V.isPointLight===!0?F.customDistanceMaterial:F.customDepthMaterial;if(U!==void 0)T=U;else if(T=V.isPointLight===!0?l:a,n.localClippingEnabled&&L.clipShadows===!0&&Array.isArray(L.clippingPlanes)&&L.clippingPlanes.length!==0||L.displacementMap&&L.displacementScale!==0||L.alphaMap&&L.alphaTest>0||L.map&&L.alphaTest>0){const rt=T.uuid,Z=L.uuid;let ot=c[rt];ot===void 0&&(ot={},c[rt]=ot);let at=ot[Z];at===void 0&&(at=T.clone(),ot[Z]=at,L.addEventListener("dispose",O)),T=at}if(T.visible=L.visible,T.wireframe=L.wireframe,w===Fn?T.side=L.shadowSide!==null?L.shadowSide:L.side:T.side=L.shadowSide!==null?L.shadowSide:h[L.side],T.alphaMap=L.alphaMap,T.alphaTest=L.alphaTest,T.map=L.map,T.clipShadows=L.clipShadows,T.clippingPlanes=L.clippingPlanes,T.clipIntersection=L.clipIntersection,T.displacementMap=L.displacementMap,T.displacementScale=L.displacementScale,T.displacementBias=L.displacementBias,T.wireframeLinewidth=L.wireframeLinewidth,T.linewidth=L.linewidth,V.isPointLight===!0&&T.isMeshDistanceMaterial===!0){const rt=n.properties.get(T);rt.light=V}return T}function b(F,L,V,w,T){if(F.visible===!1)return;if(F.layers.test(L.layers)&&(F.isMesh||F.isLine||F.isPoints)&&(F.castShadow||F.receiveShadow&&T===Fn)&&(!F.frustumCulled||i.intersectsObject(F))){F.modelViewMatrix.multiplyMatrices(V.matrixWorldInverse,F.matrixWorld);const Z=t.update(F),ot=F.material;if(Array.isArray(ot)){const at=Z.groups;for(let et=0,nt=at.length;et<nt;et++){const G=at[et],mt=ot[G.materialIndex];if(mt&&mt.visible){const St=C(F,mt,w,T);F.onBeforeShadow(n,F,L,V,Z,St,G),n.renderBufferDirect(V,null,Z,St,F,G),F.onAfterShadow(n,F,L,V,Z,St,G)}}}else if(ot.visible){const at=C(F,ot,w,T);F.onBeforeShadow(n,F,L,V,Z,at,null),n.renderBufferDirect(V,null,Z,at,F,null),F.onAfterShadow(n,F,L,V,Z,at,null)}}const rt=F.children;for(let Z=0,ot=rt.length;Z<ot;Z++)b(rt[Z],L,V,w,T)}function O(F){F.target.removeEventListener("dispose",O);for(const V in c){const w=c[V],T=F.target.uuid;T in w&&(w[T].dispose(),delete w[T])}}}const lM={[ba]:Aa,[wa]:Pa,[Ra]:Da,[pr]:Ca,[Aa]:ba,[Pa]:wa,[Da]:Ra,[Ca]:pr};function cM(n,t){function e(){let N=!1;const _t=new ve;let j=null;const st=new ve(0,0,0,0);return{setMask:function(Mt){j!==Mt&&!N&&(n.colorMask(Mt,Mt,Mt,Mt),j=Mt)},setLocked:function(Mt){N=Mt},setClear:function(Mt,vt,Vt,pe,Ee){Ee===!0&&(Mt*=pe,vt*=pe,Vt*=pe),_t.set(Mt,vt,Vt,pe),st.equals(_t)===!1&&(n.clearColor(Mt,vt,Vt,pe),st.copy(_t))},reset:function(){N=!1,j=null,st.set(-1,0,0,0)}}}function i(){let N=!1,_t=!1,j=null,st=null,Mt=null;return{setReversed:function(vt){if(_t!==vt){const Vt=t.get("EXT_clip_control");_t?Vt.clipControlEXT(Vt.LOWER_LEFT_EXT,Vt.ZERO_TO_ONE_EXT):Vt.clipControlEXT(Vt.LOWER_LEFT_EXT,Vt.NEGATIVE_ONE_TO_ONE_EXT);const pe=Mt;Mt=null,this.setClear(pe)}_t=vt},getReversed:function(){return _t},setTest:function(vt){vt?gt(n.DEPTH_TEST):Dt(n.DEPTH_TEST)},setMask:function(vt){j!==vt&&!N&&(n.depthMask(vt),j=vt)},setFunc:function(vt){if(_t&&(vt=lM[vt]),st!==vt){switch(vt){case ba:n.depthFunc(n.NEVER);break;case Aa:n.depthFunc(n.ALWAYS);break;case wa:n.depthFunc(n.LESS);break;case pr:n.depthFunc(n.LEQUAL);break;case Ra:n.depthFunc(n.EQUAL);break;case Ca:n.depthFunc(n.GEQUAL);break;case Pa:n.depthFunc(n.GREATER);break;case Da:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}st=vt}},setLocked:function(vt){N=vt},setClear:function(vt){Mt!==vt&&(_t&&(vt=1-vt),n.clearDepth(vt),Mt=vt)},reset:function(){N=!1,j=null,st=null,Mt=null,_t=!1}}}function r(){let N=!1,_t=null,j=null,st=null,Mt=null,vt=null,Vt=null,pe=null,Ee=null;return{setTest:function(se){N||(se?gt(n.STENCIL_TEST):Dt(n.STENCIL_TEST))},setMask:function(se){_t!==se&&!N&&(n.stencilMask(se),_t=se)},setFunc:function(se,cn,Cn){(j!==se||st!==cn||Mt!==Cn)&&(n.stencilFunc(se,cn,Cn),j=se,st=cn,Mt=Cn)},setOp:function(se,cn,Cn){(vt!==se||Vt!==cn||pe!==Cn)&&(n.stencilOp(se,cn,Cn),vt=se,Vt=cn,pe=Cn)},setLocked:function(se){N=se},setClear:function(se){Ee!==se&&(n.clearStencil(se),Ee=se)},reset:function(){N=!1,_t=null,j=null,st=null,Mt=null,vt=null,Vt=null,pe=null,Ee=null}}}const s=new e,o=new i,a=new r,l=new WeakMap,c=new WeakMap;let u={},h={},d=new WeakMap,p=[],x=null,S=!1,g=null,f=null,P=null,C=null,b=null,O=null,F=null,L=new ee(0,0,0),V=0,w=!1,T=null,U=null,rt=null,Z=null,ot=null;const at=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let et=!1,nt=0;const G=n.getParameter(n.VERSION);G.indexOf("WebGL")!==-1?(nt=parseFloat(/^WebGL (\d)/.exec(G)[1]),et=nt>=1):G.indexOf("OpenGL ES")!==-1&&(nt=parseFloat(/^OpenGL ES (\d)/.exec(G)[1]),et=nt>=2);let mt=null,St={};const xt=n.getParameter(n.SCISSOR_BOX),Ut=n.getParameter(n.VIEWPORT),Kt=new ve().fromArray(xt),it=new ve().fromArray(Ut);function ft(N,_t,j,st){const Mt=new Uint8Array(4),vt=n.createTexture();n.bindTexture(N,vt),n.texParameteri(N,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(N,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let Vt=0;Vt<j;Vt++)N===n.TEXTURE_3D||N===n.TEXTURE_2D_ARRAY?n.texImage3D(_t,0,n.RGBA,1,1,st,0,n.RGBA,n.UNSIGNED_BYTE,Mt):n.texImage2D(_t+Vt,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,Mt);return vt}const At={};At[n.TEXTURE_2D]=ft(n.TEXTURE_2D,n.TEXTURE_2D,1),At[n.TEXTURE_CUBE_MAP]=ft(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),At[n.TEXTURE_2D_ARRAY]=ft(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),At[n.TEXTURE_3D]=ft(n.TEXTURE_3D,n.TEXTURE_3D,1,1),s.setClear(0,0,0,1),o.setClear(1),a.setClear(0),gt(n.DEPTH_TEST),o.setFunc(pr),tt(!1),J(Rc),gt(n.CULL_FACE),v(ui);function gt(N){u[N]!==!0&&(n.enable(N),u[N]=!0)}function Dt(N){u[N]!==!1&&(n.disable(N),u[N]=!1)}function Ft(N,_t){return h[N]!==_t?(n.bindFramebuffer(N,_t),h[N]=_t,N===n.DRAW_FRAMEBUFFER&&(h[n.FRAMEBUFFER]=_t),N===n.FRAMEBUFFER&&(h[n.DRAW_FRAMEBUFFER]=_t),!0):!1}function Bt(N,_t){let j=p,st=!1;if(N){j=d.get(_t),j===void 0&&(j=[],d.set(_t,j));const Mt=N.textures;if(j.length!==Mt.length||j[0]!==n.COLOR_ATTACHMENT0){for(let vt=0,Vt=Mt.length;vt<Vt;vt++)j[vt]=n.COLOR_ATTACHMENT0+vt;j.length=Mt.length,st=!0}}else j[0]!==n.BACK&&(j[0]=n.BACK,st=!0);st&&n.drawBuffers(j)}function Zt(N){return x!==N?(n.useProgram(N),x=N,!0):!1}const qt={[wi]:n.FUNC_ADD,[nm]:n.FUNC_SUBTRACT,[im]:n.FUNC_REVERSE_SUBTRACT};qt[rm]=n.MIN,qt[sm]=n.MAX;const R={[om]:n.ZERO,[am]:n.ONE,[lm]:n.SRC_COLOR,[ya]:n.SRC_ALPHA,[pm]:n.SRC_ALPHA_SATURATE,[fm]:n.DST_COLOR,[um]:n.DST_ALPHA,[cm]:n.ONE_MINUS_SRC_COLOR,[Ta]:n.ONE_MINUS_SRC_ALPHA,[dm]:n.ONE_MINUS_DST_COLOR,[hm]:n.ONE_MINUS_DST_ALPHA,[mm]:n.CONSTANT_COLOR,[_m]:n.ONE_MINUS_CONSTANT_COLOR,[gm]:n.CONSTANT_ALPHA,[vm]:n.ONE_MINUS_CONSTANT_ALPHA};function v(N,_t,j,st,Mt,vt,Vt,pe,Ee,se){if(N===ui){S===!0&&(Dt(n.BLEND),S=!1);return}if(S===!1&&(gt(n.BLEND),S=!0),N!==em){if(N!==g||se!==w){if((f!==wi||b!==wi)&&(n.blendEquation(n.FUNC_ADD),f=wi,b=wi),se)switch(N){case cr:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Cc:n.blendFunc(n.ONE,n.ONE);break;case Pc:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Dc:n.blendFuncSeparate(n.ZERO,n.SRC_COLOR,n.ZERO,n.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",N);break}else switch(N){case cr:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Cc:n.blendFunc(n.SRC_ALPHA,n.ONE);break;case Pc:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Dc:n.blendFunc(n.ZERO,n.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",N);break}P=null,C=null,O=null,F=null,L.set(0,0,0),V=0,g=N,w=se}return}Mt=Mt||_t,vt=vt||j,Vt=Vt||st,(_t!==f||Mt!==b)&&(n.blendEquationSeparate(qt[_t],qt[Mt]),f=_t,b=Mt),(j!==P||st!==C||vt!==O||Vt!==F)&&(n.blendFuncSeparate(R[j],R[st],R[vt],R[Vt]),P=j,C=st,O=vt,F=Vt),(pe.equals(L)===!1||Ee!==V)&&(n.blendColor(pe.r,pe.g,pe.b,Ee),L.copy(pe),V=Ee),g=N,w=!1}function $(N,_t){N.side===Hn?Dt(n.CULL_FACE):gt(n.CULL_FACE);let j=N.side===We;_t&&(j=!j),tt(j),N.blending===cr&&N.transparent===!1?v(ui):v(N.blending,N.blendEquation,N.blendSrc,N.blendDst,N.blendEquationAlpha,N.blendSrcAlpha,N.blendDstAlpha,N.blendColor,N.blendAlpha,N.premultipliedAlpha),o.setFunc(N.depthFunc),o.setTest(N.depthTest),o.setMask(N.depthWrite),s.setMask(N.colorWrite);const st=N.stencilWrite;a.setTest(st),st&&(a.setMask(N.stencilWriteMask),a.setFunc(N.stencilFunc,N.stencilRef,N.stencilFuncMask),a.setOp(N.stencilFail,N.stencilZFail,N.stencilZPass)),ct(N.polygonOffset,N.polygonOffsetFactor,N.polygonOffsetUnits),N.alphaToCoverage===!0?gt(n.SAMPLE_ALPHA_TO_COVERAGE):Dt(n.SAMPLE_ALPHA_TO_COVERAGE)}function tt(N){T!==N&&(N?n.frontFace(n.CW):n.frontFace(n.CCW),T=N)}function J(N){N!==Jp?(gt(n.CULL_FACE),N!==U&&(N===Rc?n.cullFace(n.BACK):N===Qp?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):Dt(n.CULL_FACE),U=N}function W(N){N!==rt&&(et&&n.lineWidth(N),rt=N)}function ct(N,_t,j){N?(gt(n.POLYGON_OFFSET_FILL),(Z!==_t||ot!==j)&&(n.polygonOffset(_t,j),Z=_t,ot=j)):Dt(n.POLYGON_OFFSET_FILL)}function Q(N){N?gt(n.SCISSOR_TEST):Dt(n.SCISSOR_TEST)}function M(N){N===void 0&&(N=n.TEXTURE0+at-1),mt!==N&&(n.activeTexture(N),mt=N)}function _(N,_t,j){j===void 0&&(mt===null?j=n.TEXTURE0+at-1:j=mt);let st=St[j];st===void 0&&(st={type:void 0,texture:void 0},St[j]=st),(st.type!==N||st.texture!==_t)&&(mt!==j&&(n.activeTexture(j),mt=j),n.bindTexture(N,_t||At[N]),st.type=N,st.texture=_t)}function D(){const N=St[mt];N!==void 0&&N.type!==void 0&&(n.bindTexture(N.type,null),N.type=void 0,N.texture=void 0)}function m(){try{n.compressedTexImage2D.apply(n,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function y(){try{n.compressedTexImage3D.apply(n,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function A(){try{n.texSubImage2D.apply(n,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function I(){try{n.texSubImage3D.apply(n,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function z(){try{n.compressedTexSubImage2D.apply(n,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function Y(){try{n.compressedTexSubImage3D.apply(n,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function ht(){try{n.texStorage2D.apply(n,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function X(){try{n.texStorage3D.apply(n,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function lt(){try{n.texImage2D.apply(n,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function ut(){try{n.texImage3D.apply(n,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function Et(N){Kt.equals(N)===!1&&(n.scissor(N.x,N.y,N.z,N.w),Kt.copy(N))}function dt(N){it.equals(N)===!1&&(n.viewport(N.x,N.y,N.z,N.w),it.copy(N))}function wt(N,_t){let j=c.get(_t);j===void 0&&(j=new WeakMap,c.set(_t,j));let st=j.get(N);st===void 0&&(st=n.getUniformBlockIndex(_t,N.name),j.set(N,st))}function Rt(N,_t){const st=c.get(_t).get(N);l.get(_t)!==st&&(n.uniformBlockBinding(_t,st,N.__bindingPointIndex),l.set(_t,st))}function Ot(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),o.setReversed(!1),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),u={},mt=null,St={},h={},d=new WeakMap,p=[],x=null,S=!1,g=null,f=null,P=null,C=null,b=null,O=null,F=null,L=new ee(0,0,0),V=0,w=!1,T=null,U=null,rt=null,Z=null,ot=null,Kt.set(0,0,n.canvas.width,n.canvas.height),it.set(0,0,n.canvas.width,n.canvas.height),s.reset(),o.reset(),a.reset()}return{buffers:{color:s,depth:o,stencil:a},enable:gt,disable:Dt,bindFramebuffer:Ft,drawBuffers:Bt,useProgram:Zt,setBlending:v,setMaterial:$,setFlipSided:tt,setCullFace:J,setLineWidth:W,setPolygonOffset:ct,setScissorTest:Q,activeTexture:M,bindTexture:_,unbindTexture:D,compressedTexImage2D:m,compressedTexImage3D:y,texImage2D:lt,texImage3D:ut,updateUBOMapping:wt,uniformBlockBinding:Rt,texStorage2D:ht,texStorage3D:X,texSubImage2D:A,texSubImage3D:I,compressedTexSubImage2D:z,compressedTexSubImage3D:Y,scissor:Et,viewport:dt,reset:Ot}}function uM(n,t,e,i,r,s,o){const a=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new Yt,u=new WeakMap;let h;const d=new WeakMap;let p=!1;try{p=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function x(M,_){return p?new OffscreenCanvas(M,_):no("canvas")}function S(M,_,D){let m=1;const y=Q(M);if((y.width>D||y.height>D)&&(m=D/Math.max(y.width,y.height)),m<1)if(typeof HTMLImageElement<"u"&&M instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&M instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&M instanceof ImageBitmap||typeof VideoFrame<"u"&&M instanceof VideoFrame){const A=Math.floor(m*y.width),I=Math.floor(m*y.height);h===void 0&&(h=x(A,I));const z=_?x(A,I):h;return z.width=A,z.height=I,z.getContext("2d").drawImage(M,0,0,A,I),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+y.width+"x"+y.height+") to ("+A+"x"+I+")."),z}else return"data"in M&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+y.width+"x"+y.height+")."),M;return M}function g(M){return M.generateMipmaps}function f(M){n.generateMipmap(M)}function P(M){return M.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:M.isWebGL3DRenderTarget?n.TEXTURE_3D:M.isWebGLArrayRenderTarget||M.isCompressedArrayTexture?n.TEXTURE_2D_ARRAY:n.TEXTURE_2D}function C(M,_,D,m,y=!1){if(M!==null){if(n[M]!==void 0)return n[M];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+M+"'")}let A=_;if(_===n.RED&&(D===n.FLOAT&&(A=n.R32F),D===n.HALF_FLOAT&&(A=n.R16F),D===n.UNSIGNED_BYTE&&(A=n.R8)),_===n.RED_INTEGER&&(D===n.UNSIGNED_BYTE&&(A=n.R8UI),D===n.UNSIGNED_SHORT&&(A=n.R16UI),D===n.UNSIGNED_INT&&(A=n.R32UI),D===n.BYTE&&(A=n.R8I),D===n.SHORT&&(A=n.R16I),D===n.INT&&(A=n.R32I)),_===n.RG&&(D===n.FLOAT&&(A=n.RG32F),D===n.HALF_FLOAT&&(A=n.RG16F),D===n.UNSIGNED_BYTE&&(A=n.RG8)),_===n.RG_INTEGER&&(D===n.UNSIGNED_BYTE&&(A=n.RG8UI),D===n.UNSIGNED_SHORT&&(A=n.RG16UI),D===n.UNSIGNED_INT&&(A=n.RG32UI),D===n.BYTE&&(A=n.RG8I),D===n.SHORT&&(A=n.RG16I),D===n.INT&&(A=n.RG32I)),_===n.RGB_INTEGER&&(D===n.UNSIGNED_BYTE&&(A=n.RGB8UI),D===n.UNSIGNED_SHORT&&(A=n.RGB16UI),D===n.UNSIGNED_INT&&(A=n.RGB32UI),D===n.BYTE&&(A=n.RGB8I),D===n.SHORT&&(A=n.RGB16I),D===n.INT&&(A=n.RGB32I)),_===n.RGBA_INTEGER&&(D===n.UNSIGNED_BYTE&&(A=n.RGBA8UI),D===n.UNSIGNED_SHORT&&(A=n.RGBA16UI),D===n.UNSIGNED_INT&&(A=n.RGBA32UI),D===n.BYTE&&(A=n.RGBA8I),D===n.SHORT&&(A=n.RGBA16I),D===n.INT&&(A=n.RGBA32I)),_===n.RGB&&D===n.UNSIGNED_INT_5_9_9_9_REV&&(A=n.RGB9_E5),_===n.RGBA){const I=y?to:Qt.getTransfer(m);D===n.FLOAT&&(A=n.RGBA32F),D===n.HALF_FLOAT&&(A=n.RGBA16F),D===n.UNSIGNED_BYTE&&(A=I===oe?n.SRGB8_ALPHA8:n.RGBA8),D===n.UNSIGNED_SHORT_4_4_4_4&&(A=n.RGBA4),D===n.UNSIGNED_SHORT_5_5_5_1&&(A=n.RGB5_A1)}return(A===n.R16F||A===n.R32F||A===n.RG16F||A===n.RG32F||A===n.RGBA16F||A===n.RGBA32F)&&t.get("EXT_color_buffer_float"),A}function b(M,_){let D;return M?_===null||_===Ii||_===gr?D=n.DEPTH24_STENCIL8:_===Vn?D=n.DEPTH32F_STENCIL8:_===Jr&&(D=n.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):_===null||_===Ii||_===gr?D=n.DEPTH_COMPONENT24:_===Vn?D=n.DEPTH_COMPONENT32F:_===Jr&&(D=n.DEPTH_COMPONENT16),D}function O(M,_){return g(M)===!0||M.isFramebufferTexture&&M.minFilter!==xn&&M.minFilter!==Tn?Math.log2(Math.max(_.width,_.height))+1:M.mipmaps!==void 0&&M.mipmaps.length>0?M.mipmaps.length:M.isCompressedTexture&&Array.isArray(M.image)?_.mipmaps.length:1}function F(M){const _=M.target;_.removeEventListener("dispose",F),V(_),_.isVideoTexture&&u.delete(_)}function L(M){const _=M.target;_.removeEventListener("dispose",L),T(_)}function V(M){const _=i.get(M);if(_.__webglInit===void 0)return;const D=M.source,m=d.get(D);if(m){const y=m[_.__cacheKey];y.usedTimes--,y.usedTimes===0&&w(M),Object.keys(m).length===0&&d.delete(D)}i.remove(M)}function w(M){const _=i.get(M);n.deleteTexture(_.__webglTexture);const D=M.source,m=d.get(D);delete m[_.__cacheKey],o.memory.textures--}function T(M){const _=i.get(M);if(M.depthTexture&&(M.depthTexture.dispose(),i.remove(M.depthTexture)),M.isWebGLCubeRenderTarget)for(let m=0;m<6;m++){if(Array.isArray(_.__webglFramebuffer[m]))for(let y=0;y<_.__webglFramebuffer[m].length;y++)n.deleteFramebuffer(_.__webglFramebuffer[m][y]);else n.deleteFramebuffer(_.__webglFramebuffer[m]);_.__webglDepthbuffer&&n.deleteRenderbuffer(_.__webglDepthbuffer[m])}else{if(Array.isArray(_.__webglFramebuffer))for(let m=0;m<_.__webglFramebuffer.length;m++)n.deleteFramebuffer(_.__webglFramebuffer[m]);else n.deleteFramebuffer(_.__webglFramebuffer);if(_.__webglDepthbuffer&&n.deleteRenderbuffer(_.__webglDepthbuffer),_.__webglMultisampledFramebuffer&&n.deleteFramebuffer(_.__webglMultisampledFramebuffer),_.__webglColorRenderbuffer)for(let m=0;m<_.__webglColorRenderbuffer.length;m++)_.__webglColorRenderbuffer[m]&&n.deleteRenderbuffer(_.__webglColorRenderbuffer[m]);_.__webglDepthRenderbuffer&&n.deleteRenderbuffer(_.__webglDepthRenderbuffer)}const D=M.textures;for(let m=0,y=D.length;m<y;m++){const A=i.get(D[m]);A.__webglTexture&&(n.deleteTexture(A.__webglTexture),o.memory.textures--),i.remove(D[m])}i.remove(M)}let U=0;function rt(){U=0}function Z(){const M=U;return M>=r.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+M+" texture units while this GPU supports only "+r.maxTextures),U+=1,M}function ot(M){const _=[];return _.push(M.wrapS),_.push(M.wrapT),_.push(M.wrapR||0),_.push(M.magFilter),_.push(M.minFilter),_.push(M.anisotropy),_.push(M.internalFormat),_.push(M.format),_.push(M.type),_.push(M.generateMipmaps),_.push(M.premultiplyAlpha),_.push(M.flipY),_.push(M.unpackAlignment),_.push(M.colorSpace),_.join()}function at(M,_){const D=i.get(M);if(M.isVideoTexture&&W(M),M.isRenderTargetTexture===!1&&M.version>0&&D.__version!==M.version){const m=M.image;if(m===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(m.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{it(D,M,_);return}}e.bindTexture(n.TEXTURE_2D,D.__webglTexture,n.TEXTURE0+_)}function et(M,_){const D=i.get(M);if(M.version>0&&D.__version!==M.version){it(D,M,_);return}e.bindTexture(n.TEXTURE_2D_ARRAY,D.__webglTexture,n.TEXTURE0+_)}function nt(M,_){const D=i.get(M);if(M.version>0&&D.__version!==M.version){it(D,M,_);return}e.bindTexture(n.TEXTURE_3D,D.__webglTexture,n.TEXTURE0+_)}function G(M,_){const D=i.get(M);if(M.version>0&&D.__version!==M.version){ft(D,M,_);return}e.bindTexture(n.TEXTURE_CUBE_MAP,D.__webglTexture,n.TEXTURE0+_)}const mt={[Ua]:n.REPEAT,[Ci]:n.CLAMP_TO_EDGE,[Na]:n.MIRRORED_REPEAT},St={[xn]:n.NEAREST,[Rm]:n.NEAREST_MIPMAP_NEAREST,[fs]:n.NEAREST_MIPMAP_LINEAR,[Tn]:n.LINEAR,[No]:n.LINEAR_MIPMAP_NEAREST,[Pi]:n.LINEAR_MIPMAP_LINEAR},xt={[Im]:n.NEVER,[zm]:n.ALWAYS,[Um]:n.LESS,[Xh]:n.LEQUAL,[Nm]:n.EQUAL,[Bm]:n.GEQUAL,[Fm]:n.GREATER,[Om]:n.NOTEQUAL};function Ut(M,_){if(_.type===Vn&&t.has("OES_texture_float_linear")===!1&&(_.magFilter===Tn||_.magFilter===No||_.magFilter===fs||_.magFilter===Pi||_.minFilter===Tn||_.minFilter===No||_.minFilter===fs||_.minFilter===Pi)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),n.texParameteri(M,n.TEXTURE_WRAP_S,mt[_.wrapS]),n.texParameteri(M,n.TEXTURE_WRAP_T,mt[_.wrapT]),(M===n.TEXTURE_3D||M===n.TEXTURE_2D_ARRAY)&&n.texParameteri(M,n.TEXTURE_WRAP_R,mt[_.wrapR]),n.texParameteri(M,n.TEXTURE_MAG_FILTER,St[_.magFilter]),n.texParameteri(M,n.TEXTURE_MIN_FILTER,St[_.minFilter]),_.compareFunction&&(n.texParameteri(M,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(M,n.TEXTURE_COMPARE_FUNC,xt[_.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(_.magFilter===xn||_.minFilter!==fs&&_.minFilter!==Pi||_.type===Vn&&t.has("OES_texture_float_linear")===!1)return;if(_.anisotropy>1||i.get(_).__currentAnisotropy){const D=t.get("EXT_texture_filter_anisotropic");n.texParameterf(M,D.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(_.anisotropy,r.getMaxAnisotropy())),i.get(_).__currentAnisotropy=_.anisotropy}}}function Kt(M,_){let D=!1;M.__webglInit===void 0&&(M.__webglInit=!0,_.addEventListener("dispose",F));const m=_.source;let y=d.get(m);y===void 0&&(y={},d.set(m,y));const A=ot(_);if(A!==M.__cacheKey){y[A]===void 0&&(y[A]={texture:n.createTexture(),usedTimes:0},o.memory.textures++,D=!0),y[A].usedTimes++;const I=y[M.__cacheKey];I!==void 0&&(y[M.__cacheKey].usedTimes--,I.usedTimes===0&&w(_)),M.__cacheKey=A,M.__webglTexture=y[A].texture}return D}function it(M,_,D){let m=n.TEXTURE_2D;(_.isDataArrayTexture||_.isCompressedArrayTexture)&&(m=n.TEXTURE_2D_ARRAY),_.isData3DTexture&&(m=n.TEXTURE_3D);const y=Kt(M,_),A=_.source;e.bindTexture(m,M.__webglTexture,n.TEXTURE0+D);const I=i.get(A);if(A.version!==I.__version||y===!0){e.activeTexture(n.TEXTURE0+D);const z=Qt.getPrimaries(Qt.workingColorSpace),Y=_.colorSpace===oi?null:Qt.getPrimaries(_.colorSpace),ht=_.colorSpace===oi||z===Y?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,_.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,_.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,ht);let X=S(_.image,!1,r.maxTextureSize);X=ct(_,X);const lt=s.convert(_.format,_.colorSpace),ut=s.convert(_.type);let Et=C(_.internalFormat,lt,ut,_.colorSpace,_.isVideoTexture);Ut(m,_);let dt;const wt=_.mipmaps,Rt=_.isVideoTexture!==!0,Ot=I.__version===void 0||y===!0,N=A.dataReady,_t=O(_,X);if(_.isDepthTexture)Et=b(_.format===vr,_.type),Ot&&(Rt?e.texStorage2D(n.TEXTURE_2D,1,Et,X.width,X.height):e.texImage2D(n.TEXTURE_2D,0,Et,X.width,X.height,0,lt,ut,null));else if(_.isDataTexture)if(wt.length>0){Rt&&Ot&&e.texStorage2D(n.TEXTURE_2D,_t,Et,wt[0].width,wt[0].height);for(let j=0,st=wt.length;j<st;j++)dt=wt[j],Rt?N&&e.texSubImage2D(n.TEXTURE_2D,j,0,0,dt.width,dt.height,lt,ut,dt.data):e.texImage2D(n.TEXTURE_2D,j,Et,dt.width,dt.height,0,lt,ut,dt.data);_.generateMipmaps=!1}else Rt?(Ot&&e.texStorage2D(n.TEXTURE_2D,_t,Et,X.width,X.height),N&&e.texSubImage2D(n.TEXTURE_2D,0,0,0,X.width,X.height,lt,ut,X.data)):e.texImage2D(n.TEXTURE_2D,0,Et,X.width,X.height,0,lt,ut,X.data);else if(_.isCompressedTexture)if(_.isCompressedArrayTexture){Rt&&Ot&&e.texStorage3D(n.TEXTURE_2D_ARRAY,_t,Et,wt[0].width,wt[0].height,X.depth);for(let j=0,st=wt.length;j<st;j++)if(dt=wt[j],_.format!==gn)if(lt!==null)if(Rt){if(N)if(_.layerUpdates.size>0){const Mt=ru(dt.width,dt.height,_.format,_.type);for(const vt of _.layerUpdates){const Vt=dt.data.subarray(vt*Mt/dt.data.BYTES_PER_ELEMENT,(vt+1)*Mt/dt.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,j,0,0,vt,dt.width,dt.height,1,lt,Vt)}_.clearLayerUpdates()}else e.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,j,0,0,0,dt.width,dt.height,X.depth,lt,dt.data)}else e.compressedTexImage3D(n.TEXTURE_2D_ARRAY,j,Et,dt.width,dt.height,X.depth,0,dt.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Rt?N&&e.texSubImage3D(n.TEXTURE_2D_ARRAY,j,0,0,0,dt.width,dt.height,X.depth,lt,ut,dt.data):e.texImage3D(n.TEXTURE_2D_ARRAY,j,Et,dt.width,dt.height,X.depth,0,lt,ut,dt.data)}else{Rt&&Ot&&e.texStorage2D(n.TEXTURE_2D,_t,Et,wt[0].width,wt[0].height);for(let j=0,st=wt.length;j<st;j++)dt=wt[j],_.format!==gn?lt!==null?Rt?N&&e.compressedTexSubImage2D(n.TEXTURE_2D,j,0,0,dt.width,dt.height,lt,dt.data):e.compressedTexImage2D(n.TEXTURE_2D,j,Et,dt.width,dt.height,0,dt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Rt?N&&e.texSubImage2D(n.TEXTURE_2D,j,0,0,dt.width,dt.height,lt,ut,dt.data):e.texImage2D(n.TEXTURE_2D,j,Et,dt.width,dt.height,0,lt,ut,dt.data)}else if(_.isDataArrayTexture)if(Rt){if(Ot&&e.texStorage3D(n.TEXTURE_2D_ARRAY,_t,Et,X.width,X.height,X.depth),N)if(_.layerUpdates.size>0){const j=ru(X.width,X.height,_.format,_.type);for(const st of _.layerUpdates){const Mt=X.data.subarray(st*j/X.data.BYTES_PER_ELEMENT,(st+1)*j/X.data.BYTES_PER_ELEMENT);e.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,st,X.width,X.height,1,lt,ut,Mt)}_.clearLayerUpdates()}else e.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,X.width,X.height,X.depth,lt,ut,X.data)}else e.texImage3D(n.TEXTURE_2D_ARRAY,0,Et,X.width,X.height,X.depth,0,lt,ut,X.data);else if(_.isData3DTexture)Rt?(Ot&&e.texStorage3D(n.TEXTURE_3D,_t,Et,X.width,X.height,X.depth),N&&e.texSubImage3D(n.TEXTURE_3D,0,0,0,0,X.width,X.height,X.depth,lt,ut,X.data)):e.texImage3D(n.TEXTURE_3D,0,Et,X.width,X.height,X.depth,0,lt,ut,X.data);else if(_.isFramebufferTexture){if(Ot)if(Rt)e.texStorage2D(n.TEXTURE_2D,_t,Et,X.width,X.height);else{let j=X.width,st=X.height;for(let Mt=0;Mt<_t;Mt++)e.texImage2D(n.TEXTURE_2D,Mt,Et,j,st,0,lt,ut,null),j>>=1,st>>=1}}else if(wt.length>0){if(Rt&&Ot){const j=Q(wt[0]);e.texStorage2D(n.TEXTURE_2D,_t,Et,j.width,j.height)}for(let j=0,st=wt.length;j<st;j++)dt=wt[j],Rt?N&&e.texSubImage2D(n.TEXTURE_2D,j,0,0,lt,ut,dt):e.texImage2D(n.TEXTURE_2D,j,Et,lt,ut,dt);_.generateMipmaps=!1}else if(Rt){if(Ot){const j=Q(X);e.texStorage2D(n.TEXTURE_2D,_t,Et,j.width,j.height)}N&&e.texSubImage2D(n.TEXTURE_2D,0,0,0,lt,ut,X)}else e.texImage2D(n.TEXTURE_2D,0,Et,lt,ut,X);g(_)&&f(m),I.__version=A.version,_.onUpdate&&_.onUpdate(_)}M.__version=_.version}function ft(M,_,D){if(_.image.length!==6)return;const m=Kt(M,_),y=_.source;e.bindTexture(n.TEXTURE_CUBE_MAP,M.__webglTexture,n.TEXTURE0+D);const A=i.get(y);if(y.version!==A.__version||m===!0){e.activeTexture(n.TEXTURE0+D);const I=Qt.getPrimaries(Qt.workingColorSpace),z=_.colorSpace===oi?null:Qt.getPrimaries(_.colorSpace),Y=_.colorSpace===oi||I===z?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,_.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,_.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,Y);const ht=_.isCompressedTexture||_.image[0].isCompressedTexture,X=_.image[0]&&_.image[0].isDataTexture,lt=[];for(let st=0;st<6;st++)!ht&&!X?lt[st]=S(_.image[st],!0,r.maxCubemapSize):lt[st]=X?_.image[st].image:_.image[st],lt[st]=ct(_,lt[st]);const ut=lt[0],Et=s.convert(_.format,_.colorSpace),dt=s.convert(_.type),wt=C(_.internalFormat,Et,dt,_.colorSpace),Rt=_.isVideoTexture!==!0,Ot=A.__version===void 0||m===!0,N=y.dataReady;let _t=O(_,ut);Ut(n.TEXTURE_CUBE_MAP,_);let j;if(ht){Rt&&Ot&&e.texStorage2D(n.TEXTURE_CUBE_MAP,_t,wt,ut.width,ut.height);for(let st=0;st<6;st++){j=lt[st].mipmaps;for(let Mt=0;Mt<j.length;Mt++){const vt=j[Mt];_.format!==gn?Et!==null?Rt?N&&e.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+st,Mt,0,0,vt.width,vt.height,Et,vt.data):e.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+st,Mt,wt,vt.width,vt.height,0,vt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Rt?N&&e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+st,Mt,0,0,vt.width,vt.height,Et,dt,vt.data):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+st,Mt,wt,vt.width,vt.height,0,Et,dt,vt.data)}}}else{if(j=_.mipmaps,Rt&&Ot){j.length>0&&_t++;const st=Q(lt[0]);e.texStorage2D(n.TEXTURE_CUBE_MAP,_t,wt,st.width,st.height)}for(let st=0;st<6;st++)if(X){Rt?N&&e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+st,0,0,0,lt[st].width,lt[st].height,Et,dt,lt[st].data):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+st,0,wt,lt[st].width,lt[st].height,0,Et,dt,lt[st].data);for(let Mt=0;Mt<j.length;Mt++){const Vt=j[Mt].image[st].image;Rt?N&&e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+st,Mt+1,0,0,Vt.width,Vt.height,Et,dt,Vt.data):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+st,Mt+1,wt,Vt.width,Vt.height,0,Et,dt,Vt.data)}}else{Rt?N&&e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+st,0,0,0,Et,dt,lt[st]):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+st,0,wt,Et,dt,lt[st]);for(let Mt=0;Mt<j.length;Mt++){const vt=j[Mt];Rt?N&&e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+st,Mt+1,0,0,Et,dt,vt.image[st]):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+st,Mt+1,wt,Et,dt,vt.image[st])}}}g(_)&&f(n.TEXTURE_CUBE_MAP),A.__version=y.version,_.onUpdate&&_.onUpdate(_)}M.__version=_.version}function At(M,_,D,m,y,A){const I=s.convert(D.format,D.colorSpace),z=s.convert(D.type),Y=C(D.internalFormat,I,z,D.colorSpace),ht=i.get(_),X=i.get(D);if(X.__renderTarget=_,!ht.__hasExternalTextures){const lt=Math.max(1,_.width>>A),ut=Math.max(1,_.height>>A);y===n.TEXTURE_3D||y===n.TEXTURE_2D_ARRAY?e.texImage3D(y,A,Y,lt,ut,_.depth,0,I,z,null):e.texImage2D(y,A,Y,lt,ut,0,I,z,null)}e.bindFramebuffer(n.FRAMEBUFFER,M),J(_)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,m,y,X.__webglTexture,0,tt(_)):(y===n.TEXTURE_2D||y>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&y<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,m,y,X.__webglTexture,A),e.bindFramebuffer(n.FRAMEBUFFER,null)}function gt(M,_,D){if(n.bindRenderbuffer(n.RENDERBUFFER,M),_.depthBuffer){const m=_.depthTexture,y=m&&m.isDepthTexture?m.type:null,A=b(_.stencilBuffer,y),I=_.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,z=tt(_);J(_)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,z,A,_.width,_.height):D?n.renderbufferStorageMultisample(n.RENDERBUFFER,z,A,_.width,_.height):n.renderbufferStorage(n.RENDERBUFFER,A,_.width,_.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,I,n.RENDERBUFFER,M)}else{const m=_.textures;for(let y=0;y<m.length;y++){const A=m[y],I=s.convert(A.format,A.colorSpace),z=s.convert(A.type),Y=C(A.internalFormat,I,z,A.colorSpace),ht=tt(_);D&&J(_)===!1?n.renderbufferStorageMultisample(n.RENDERBUFFER,ht,Y,_.width,_.height):J(_)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,ht,Y,_.width,_.height):n.renderbufferStorage(n.RENDERBUFFER,Y,_.width,_.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function Dt(M,_){if(_&&_.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(n.FRAMEBUFFER,M),!(_.depthTexture&&_.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");const m=i.get(_.depthTexture);m.__renderTarget=_,(!m.__webglTexture||_.depthTexture.image.width!==_.width||_.depthTexture.image.height!==_.height)&&(_.depthTexture.image.width=_.width,_.depthTexture.image.height=_.height,_.depthTexture.needsUpdate=!0),at(_.depthTexture,0);const y=m.__webglTexture,A=tt(_);if(_.depthTexture.format===ur)J(_)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,y,0,A):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,y,0);else if(_.depthTexture.format===vr)J(_)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,y,0,A):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,y,0);else throw new Error("Unknown depthTexture format")}function Ft(M){const _=i.get(M),D=M.isWebGLCubeRenderTarget===!0;if(_.__boundDepthTexture!==M.depthTexture){const m=M.depthTexture;if(_.__depthDisposeCallback&&_.__depthDisposeCallback(),m){const y=()=>{delete _.__boundDepthTexture,delete _.__depthDisposeCallback,m.removeEventListener("dispose",y)};m.addEventListener("dispose",y),_.__depthDisposeCallback=y}_.__boundDepthTexture=m}if(M.depthTexture&&!_.__autoAllocateDepthBuffer){if(D)throw new Error("target.depthTexture not supported in Cube render targets");Dt(_.__webglFramebuffer,M)}else if(D){_.__webglDepthbuffer=[];for(let m=0;m<6;m++)if(e.bindFramebuffer(n.FRAMEBUFFER,_.__webglFramebuffer[m]),_.__webglDepthbuffer[m]===void 0)_.__webglDepthbuffer[m]=n.createRenderbuffer(),gt(_.__webglDepthbuffer[m],M,!1);else{const y=M.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,A=_.__webglDepthbuffer[m];n.bindRenderbuffer(n.RENDERBUFFER,A),n.framebufferRenderbuffer(n.FRAMEBUFFER,y,n.RENDERBUFFER,A)}}else if(e.bindFramebuffer(n.FRAMEBUFFER,_.__webglFramebuffer),_.__webglDepthbuffer===void 0)_.__webglDepthbuffer=n.createRenderbuffer(),gt(_.__webglDepthbuffer,M,!1);else{const m=M.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,y=_.__webglDepthbuffer;n.bindRenderbuffer(n.RENDERBUFFER,y),n.framebufferRenderbuffer(n.FRAMEBUFFER,m,n.RENDERBUFFER,y)}e.bindFramebuffer(n.FRAMEBUFFER,null)}function Bt(M,_,D){const m=i.get(M);_!==void 0&&At(m.__webglFramebuffer,M,M.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),D!==void 0&&Ft(M)}function Zt(M){const _=M.texture,D=i.get(M),m=i.get(_);M.addEventListener("dispose",L);const y=M.textures,A=M.isWebGLCubeRenderTarget===!0,I=y.length>1;if(I||(m.__webglTexture===void 0&&(m.__webglTexture=n.createTexture()),m.__version=_.version,o.memory.textures++),A){D.__webglFramebuffer=[];for(let z=0;z<6;z++)if(_.mipmaps&&_.mipmaps.length>0){D.__webglFramebuffer[z]=[];for(let Y=0;Y<_.mipmaps.length;Y++)D.__webglFramebuffer[z][Y]=n.createFramebuffer()}else D.__webglFramebuffer[z]=n.createFramebuffer()}else{if(_.mipmaps&&_.mipmaps.length>0){D.__webglFramebuffer=[];for(let z=0;z<_.mipmaps.length;z++)D.__webglFramebuffer[z]=n.createFramebuffer()}else D.__webglFramebuffer=n.createFramebuffer();if(I)for(let z=0,Y=y.length;z<Y;z++){const ht=i.get(y[z]);ht.__webglTexture===void 0&&(ht.__webglTexture=n.createTexture(),o.memory.textures++)}if(M.samples>0&&J(M)===!1){D.__webglMultisampledFramebuffer=n.createFramebuffer(),D.__webglColorRenderbuffer=[],e.bindFramebuffer(n.FRAMEBUFFER,D.__webglMultisampledFramebuffer);for(let z=0;z<y.length;z++){const Y=y[z];D.__webglColorRenderbuffer[z]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,D.__webglColorRenderbuffer[z]);const ht=s.convert(Y.format,Y.colorSpace),X=s.convert(Y.type),lt=C(Y.internalFormat,ht,X,Y.colorSpace,M.isXRRenderTarget===!0),ut=tt(M);n.renderbufferStorageMultisample(n.RENDERBUFFER,ut,lt,M.width,M.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+z,n.RENDERBUFFER,D.__webglColorRenderbuffer[z])}n.bindRenderbuffer(n.RENDERBUFFER,null),M.depthBuffer&&(D.__webglDepthRenderbuffer=n.createRenderbuffer(),gt(D.__webglDepthRenderbuffer,M,!0)),e.bindFramebuffer(n.FRAMEBUFFER,null)}}if(A){e.bindTexture(n.TEXTURE_CUBE_MAP,m.__webglTexture),Ut(n.TEXTURE_CUBE_MAP,_);for(let z=0;z<6;z++)if(_.mipmaps&&_.mipmaps.length>0)for(let Y=0;Y<_.mipmaps.length;Y++)At(D.__webglFramebuffer[z][Y],M,_,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+z,Y);else At(D.__webglFramebuffer[z],M,_,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+z,0);g(_)&&f(n.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(I){for(let z=0,Y=y.length;z<Y;z++){const ht=y[z],X=i.get(ht);e.bindTexture(n.TEXTURE_2D,X.__webglTexture),Ut(n.TEXTURE_2D,ht),At(D.__webglFramebuffer,M,ht,n.COLOR_ATTACHMENT0+z,n.TEXTURE_2D,0),g(ht)&&f(n.TEXTURE_2D)}e.unbindTexture()}else{let z=n.TEXTURE_2D;if((M.isWebGL3DRenderTarget||M.isWebGLArrayRenderTarget)&&(z=M.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),e.bindTexture(z,m.__webglTexture),Ut(z,_),_.mipmaps&&_.mipmaps.length>0)for(let Y=0;Y<_.mipmaps.length;Y++)At(D.__webglFramebuffer[Y],M,_,n.COLOR_ATTACHMENT0,z,Y);else At(D.__webglFramebuffer,M,_,n.COLOR_ATTACHMENT0,z,0);g(_)&&f(z),e.unbindTexture()}M.depthBuffer&&Ft(M)}function qt(M){const _=M.textures;for(let D=0,m=_.length;D<m;D++){const y=_[D];if(g(y)){const A=P(M),I=i.get(y).__webglTexture;e.bindTexture(A,I),f(A),e.unbindTexture()}}}const R=[],v=[];function $(M){if(M.samples>0){if(J(M)===!1){const _=M.textures,D=M.width,m=M.height;let y=n.COLOR_BUFFER_BIT;const A=M.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,I=i.get(M),z=_.length>1;if(z)for(let Y=0;Y<_.length;Y++)e.bindFramebuffer(n.FRAMEBUFFER,I.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Y,n.RENDERBUFFER,null),e.bindFramebuffer(n.FRAMEBUFFER,I.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Y,n.TEXTURE_2D,null,0);e.bindFramebuffer(n.READ_FRAMEBUFFER,I.__webglMultisampledFramebuffer),e.bindFramebuffer(n.DRAW_FRAMEBUFFER,I.__webglFramebuffer);for(let Y=0;Y<_.length;Y++){if(M.resolveDepthBuffer&&(M.depthBuffer&&(y|=n.DEPTH_BUFFER_BIT),M.stencilBuffer&&M.resolveStencilBuffer&&(y|=n.STENCIL_BUFFER_BIT)),z){n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,I.__webglColorRenderbuffer[Y]);const ht=i.get(_[Y]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,ht,0)}n.blitFramebuffer(0,0,D,m,0,0,D,m,y,n.NEAREST),l===!0&&(R.length=0,v.length=0,R.push(n.COLOR_ATTACHMENT0+Y),M.depthBuffer&&M.resolveDepthBuffer===!1&&(R.push(A),v.push(A),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,v)),n.invalidateFramebuffer(n.READ_FRAMEBUFFER,R))}if(e.bindFramebuffer(n.READ_FRAMEBUFFER,null),e.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),z)for(let Y=0;Y<_.length;Y++){e.bindFramebuffer(n.FRAMEBUFFER,I.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Y,n.RENDERBUFFER,I.__webglColorRenderbuffer[Y]);const ht=i.get(_[Y]).__webglTexture;e.bindFramebuffer(n.FRAMEBUFFER,I.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Y,n.TEXTURE_2D,ht,0)}e.bindFramebuffer(n.DRAW_FRAMEBUFFER,I.__webglMultisampledFramebuffer)}else if(M.depthBuffer&&M.resolveDepthBuffer===!1&&l){const _=M.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[_])}}}function tt(M){return Math.min(r.maxSamples,M.samples)}function J(M){const _=i.get(M);return M.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&_.__useRenderToTexture!==!1}function W(M){const _=o.render.frame;u.get(M)!==_&&(u.set(M,_),M.update())}function ct(M,_){const D=M.colorSpace,m=M.format,y=M.type;return M.isCompressedTexture===!0||M.isVideoTexture===!0||D!==xr&&D!==oi&&(Qt.getTransfer(D)===oe?(m!==gn||y!==Xn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",D)),_}function Q(M){return typeof HTMLImageElement<"u"&&M instanceof HTMLImageElement?(c.width=M.naturalWidth||M.width,c.height=M.naturalHeight||M.height):typeof VideoFrame<"u"&&M instanceof VideoFrame?(c.width=M.displayWidth,c.height=M.displayHeight):(c.width=M.width,c.height=M.height),c}this.allocateTextureUnit=Z,this.resetTextureUnits=rt,this.setTexture2D=at,this.setTexture2DArray=et,this.setTexture3D=nt,this.setTextureCube=G,this.rebindTextures=Bt,this.setupRenderTarget=Zt,this.updateRenderTargetMipmap=qt,this.updateMultisampleRenderTarget=$,this.setupDepthRenderbuffer=Ft,this.setupFrameBufferTexture=At,this.useMultisampledRTT=J}function hM(n,t){function e(i,r=oi){let s;const o=Qt.getTransfer(r);if(i===Xn)return n.UNSIGNED_BYTE;if(i===Ol)return n.UNSIGNED_SHORT_4_4_4_4;if(i===Bl)return n.UNSIGNED_SHORT_5_5_5_1;if(i===Oh)return n.UNSIGNED_INT_5_9_9_9_REV;if(i===Nh)return n.BYTE;if(i===Fh)return n.SHORT;if(i===Jr)return n.UNSIGNED_SHORT;if(i===Fl)return n.INT;if(i===Ii)return n.UNSIGNED_INT;if(i===Vn)return n.FLOAT;if(i===is)return n.HALF_FLOAT;if(i===Bh)return n.ALPHA;if(i===zh)return n.RGB;if(i===gn)return n.RGBA;if(i===Hh)return n.LUMINANCE;if(i===Vh)return n.LUMINANCE_ALPHA;if(i===ur)return n.DEPTH_COMPONENT;if(i===vr)return n.DEPTH_STENCIL;if(i===Gh)return n.RED;if(i===zl)return n.RED_INTEGER;if(i===kh)return n.RG;if(i===Hl)return n.RG_INTEGER;if(i===Vl)return n.RGBA_INTEGER;if(i===Gs||i===ks||i===Ws||i===Xs)if(o===oe)if(s=t.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(i===Gs)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===ks)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===Ws)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===Xs)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=t.get("WEBGL_compressed_texture_s3tc"),s!==null){if(i===Gs)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===ks)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===Ws)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===Xs)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===Fa||i===Oa||i===Ba||i===za)if(s=t.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(i===Fa)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===Oa)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===Ba)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===za)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===Ha||i===Va||i===Ga)if(s=t.get("WEBGL_compressed_texture_etc"),s!==null){if(i===Ha||i===Va)return o===oe?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(i===Ga)return o===oe?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(i===ka||i===Wa||i===Xa||i===qa||i===Ya||i===ja||i===Ka||i===$a||i===Za||i===Ja||i===Qa||i===tl||i===el||i===nl)if(s=t.get("WEBGL_compressed_texture_astc"),s!==null){if(i===ka)return o===oe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===Wa)return o===oe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===Xa)return o===oe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===qa)return o===oe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===Ya)return o===oe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===ja)return o===oe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===Ka)return o===oe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===$a)return o===oe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===Za)return o===oe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===Ja)return o===oe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===Qa)return o===oe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===tl)return o===oe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===el)return o===oe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===nl)return o===oe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===qs||i===il||i===rl)if(s=t.get("EXT_texture_compression_bptc"),s!==null){if(i===qs)return o===oe?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===il)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===rl)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===Wh||i===sl||i===ol||i===al)if(s=t.get("EXT_texture_compression_rgtc"),s!==null){if(i===qs)return s.COMPRESSED_RED_RGTC1_EXT;if(i===sl)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===ol)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===al)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===gr?n.UNSIGNED_INT_24_8:n[i]!==void 0?n[i]:null}return{convert:e}}const fM={type:"move"};class ua{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Us,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Us,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new k,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new k),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Us,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new k,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new k),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const e=this._hand;if(e)for(const i of t.hand.values())this._getHandJoint(e,i)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,i){let r=null,s=null,o=null;const a=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){o=!0;for(const S of t.hand.values()){const g=e.getJointPose(S,i),f=this._getHandJoint(c,S);g!==null&&(f.matrix.fromArray(g.transform.matrix),f.matrix.decompose(f.position,f.rotation,f.scale),f.matrixWorldNeedsUpdate=!0,f.jointRadius=g.radius),f.visible=g!==null}const u=c.joints["index-finger-tip"],h=c.joints["thumb-tip"],d=u.position.distanceTo(h.position),p=.02,x=.005;c.inputState.pinching&&d>p+x?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&d<=p-x&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(s=e.getPose(t.gripSpace,i),s!==null&&(l.matrix.fromArray(s.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,s.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(s.linearVelocity)):l.hasLinearVelocity=!1,s.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(s.angularVelocity)):l.hasAngularVelocity=!1));a!==null&&(r=e.getPose(t.targetRaySpace,i),r===null&&s!==null&&(r=s),r!==null&&(a.matrix.fromArray(r.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,r.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(r.linearVelocity)):a.hasLinearVelocity=!1,r.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(r.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(fM)))}return a!==null&&(a.visible=r!==null),l!==null&&(l.visible=s!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){const i=new Us;i.matrixAutoUpdate=!1,i.visible=!1,t.joints[e.jointName]=i,t.add(i)}return t.joints[e.jointName]}}const dM=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,pM=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class mM{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e,i){if(this.texture===null){const r=new Xe,s=t.properties.get(r);s.__webglTexture=e.texture,(e.depthNear!=i.depthNear||e.depthFar!=i.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=r}}getMesh(t){if(this.texture!==null&&this.mesh===null){const e=t.cameras[0].viewport,i=new Yn({vertexShader:dM,fragmentShader:pM,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new kn(new go(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class _M extends Oi{constructor(t,e){super();const i=this;let r=null,s=1,o=null,a="local-floor",l=1,c=null,u=null,h=null,d=null,p=null,x=null;const S=new mM,g=e.getContextAttributes();let f=null,P=null;const C=[],b=[],O=new Yt;let F=null;const L=new an;L.viewport=new ve;const V=new an;V.viewport=new ve;const w=[L,V],T=new F_;let U=null,rt=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(it){let ft=C[it];return ft===void 0&&(ft=new ua,C[it]=ft),ft.getTargetRaySpace()},this.getControllerGrip=function(it){let ft=C[it];return ft===void 0&&(ft=new ua,C[it]=ft),ft.getGripSpace()},this.getHand=function(it){let ft=C[it];return ft===void 0&&(ft=new ua,C[it]=ft),ft.getHandSpace()};function Z(it){const ft=b.indexOf(it.inputSource);if(ft===-1)return;const At=C[ft];At!==void 0&&(At.update(it.inputSource,it.frame,c||o),At.dispatchEvent({type:it.type,data:it.inputSource}))}function ot(){r.removeEventListener("select",Z),r.removeEventListener("selectstart",Z),r.removeEventListener("selectend",Z),r.removeEventListener("squeeze",Z),r.removeEventListener("squeezestart",Z),r.removeEventListener("squeezeend",Z),r.removeEventListener("end",ot),r.removeEventListener("inputsourceschange",at);for(let it=0;it<C.length;it++){const ft=b[it];ft!==null&&(b[it]=null,C[it].disconnect(ft))}U=null,rt=null,S.reset(),t.setRenderTarget(f),p=null,d=null,h=null,r=null,P=null,Kt.stop(),i.isPresenting=!1,t.setPixelRatio(F),t.setSize(O.width,O.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(it){s=it,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(it){a=it,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(it){c=it},this.getBaseLayer=function(){return d!==null?d:p},this.getBinding=function(){return h},this.getFrame=function(){return x},this.getSession=function(){return r},this.setSession=async function(it){if(r=it,r!==null){if(f=t.getRenderTarget(),r.addEventListener("select",Z),r.addEventListener("selectstart",Z),r.addEventListener("selectend",Z),r.addEventListener("squeeze",Z),r.addEventListener("squeezestart",Z),r.addEventListener("squeezeend",Z),r.addEventListener("end",ot),r.addEventListener("inputsourceschange",at),g.xrCompatible!==!0&&await e.makeXRCompatible(),F=t.getPixelRatio(),t.getSize(O),r.renderState.layers===void 0){const ft={antialias:g.antialias,alpha:!0,depth:g.depth,stencil:g.stencil,framebufferScaleFactor:s};p=new XRWebGLLayer(r,e,ft),r.updateRenderState({baseLayer:p}),t.setPixelRatio(1),t.setSize(p.framebufferWidth,p.framebufferHeight,!1),P=new Ui(p.framebufferWidth,p.framebufferHeight,{format:gn,type:Xn,colorSpace:t.outputColorSpace,stencilBuffer:g.stencil})}else{let ft=null,At=null,gt=null;g.depth&&(gt=g.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,ft=g.stencil?vr:ur,At=g.stencil?gr:Ii);const Dt={colorFormat:e.RGBA8,depthFormat:gt,scaleFactor:s};h=new XRWebGLBinding(r,e),d=h.createProjectionLayer(Dt),r.updateRenderState({layers:[d]}),t.setPixelRatio(1),t.setSize(d.textureWidth,d.textureHeight,!1),P=new Ui(d.textureWidth,d.textureHeight,{format:gn,type:Xn,depthTexture:new af(d.textureWidth,d.textureHeight,At,void 0,void 0,void 0,void 0,void 0,void 0,ft),stencilBuffer:g.stencil,colorSpace:t.outputColorSpace,samples:g.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1})}P.isXRRenderTarget=!0,this.setFoveation(l),c=null,o=await r.requestReferenceSpace(a),Kt.setContext(r),Kt.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return S.getDepthTexture()};function at(it){for(let ft=0;ft<it.removed.length;ft++){const At=it.removed[ft],gt=b.indexOf(At);gt>=0&&(b[gt]=null,C[gt].disconnect(At))}for(let ft=0;ft<it.added.length;ft++){const At=it.added[ft];let gt=b.indexOf(At);if(gt===-1){for(let Ft=0;Ft<C.length;Ft++)if(Ft>=b.length){b.push(At),gt=Ft;break}else if(b[Ft]===null){b[Ft]=At,gt=Ft;break}if(gt===-1)break}const Dt=C[gt];Dt&&Dt.connect(At)}}const et=new k,nt=new k;function G(it,ft,At){et.setFromMatrixPosition(ft.matrixWorld),nt.setFromMatrixPosition(At.matrixWorld);const gt=et.distanceTo(nt),Dt=ft.projectionMatrix.elements,Ft=At.projectionMatrix.elements,Bt=Dt[14]/(Dt[10]-1),Zt=Dt[14]/(Dt[10]+1),qt=(Dt[9]+1)/Dt[5],R=(Dt[9]-1)/Dt[5],v=(Dt[8]-1)/Dt[0],$=(Ft[8]+1)/Ft[0],tt=Bt*v,J=Bt*$,W=gt/(-v+$),ct=W*-v;if(ft.matrixWorld.decompose(it.position,it.quaternion,it.scale),it.translateX(ct),it.translateZ(W),it.matrixWorld.compose(it.position,it.quaternion,it.scale),it.matrixWorldInverse.copy(it.matrixWorld).invert(),Dt[10]===-1)it.projectionMatrix.copy(ft.projectionMatrix),it.projectionMatrixInverse.copy(ft.projectionMatrixInverse);else{const Q=Bt+W,M=Zt+W,_=tt-ct,D=J+(gt-ct),m=qt*Zt/M*Q,y=R*Zt/M*Q;it.projectionMatrix.makePerspective(_,D,m,y,Q,M),it.projectionMatrixInverse.copy(it.projectionMatrix).invert()}}function mt(it,ft){ft===null?it.matrixWorld.copy(it.matrix):it.matrixWorld.multiplyMatrices(ft.matrixWorld,it.matrix),it.matrixWorldInverse.copy(it.matrixWorld).invert()}this.updateCamera=function(it){if(r===null)return;let ft=it.near,At=it.far;S.texture!==null&&(S.depthNear>0&&(ft=S.depthNear),S.depthFar>0&&(At=S.depthFar)),T.near=V.near=L.near=ft,T.far=V.far=L.far=At,(U!==T.near||rt!==T.far)&&(r.updateRenderState({depthNear:T.near,depthFar:T.far}),U=T.near,rt=T.far),L.layers.mask=it.layers.mask|2,V.layers.mask=it.layers.mask|4,T.layers.mask=L.layers.mask|V.layers.mask;const gt=it.parent,Dt=T.cameras;mt(T,gt);for(let Ft=0;Ft<Dt.length;Ft++)mt(Dt[Ft],gt);Dt.length===2?G(T,L,V):T.projectionMatrix.copy(L.projectionMatrix),St(it,T,gt)};function St(it,ft,At){At===null?it.matrix.copy(ft.matrixWorld):(it.matrix.copy(At.matrixWorld),it.matrix.invert(),it.matrix.multiply(ft.matrixWorld)),it.matrix.decompose(it.position,it.quaternion,it.scale),it.updateMatrixWorld(!0),it.projectionMatrix.copy(ft.projectionMatrix),it.projectionMatrixInverse.copy(ft.projectionMatrixInverse),it.isPerspectiveCamera&&(it.fov=Qr*2*Math.atan(1/it.projectionMatrix.elements[5]),it.zoom=1)}this.getCamera=function(){return T},this.getFoveation=function(){if(!(d===null&&p===null))return l},this.setFoveation=function(it){l=it,d!==null&&(d.fixedFoveation=it),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=it)},this.hasDepthSensing=function(){return S.texture!==null},this.getDepthSensingMesh=function(){return S.getMesh(T)};let xt=null;function Ut(it,ft){if(u=ft.getViewerPose(c||o),x=ft,u!==null){const At=u.views;p!==null&&(t.setRenderTargetFramebuffer(P,p.framebuffer),t.setRenderTarget(P));let gt=!1;At.length!==T.cameras.length&&(T.cameras.length=0,gt=!0);for(let Ft=0;Ft<At.length;Ft++){const Bt=At[Ft];let Zt=null;if(p!==null)Zt=p.getViewport(Bt);else{const R=h.getViewSubImage(d,Bt);Zt=R.viewport,Ft===0&&(t.setRenderTargetTextures(P,R.colorTexture,d.ignoreDepthValues?void 0:R.depthStencilTexture),t.setRenderTarget(P))}let qt=w[Ft];qt===void 0&&(qt=new an,qt.layers.enable(Ft),qt.viewport=new ve,w[Ft]=qt),qt.matrix.fromArray(Bt.transform.matrix),qt.matrix.decompose(qt.position,qt.quaternion,qt.scale),qt.projectionMatrix.fromArray(Bt.projectionMatrix),qt.projectionMatrixInverse.copy(qt.projectionMatrix).invert(),qt.viewport.set(Zt.x,Zt.y,Zt.width,Zt.height),Ft===0&&(T.matrix.copy(qt.matrix),T.matrix.decompose(T.position,T.quaternion,T.scale)),gt===!0&&T.cameras.push(qt)}const Dt=r.enabledFeatures;if(Dt&&Dt.includes("depth-sensing")){const Ft=h.getDepthInformation(At[0]);Ft&&Ft.isValid&&Ft.texture&&S.init(t,Ft,r.renderState)}}for(let At=0;At<C.length;At++){const gt=b[At],Dt=C[At];gt!==null&&Dt!==void 0&&Dt.update(gt,ft,c||o)}xt&&xt(it,ft),ft.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:ft}),x=null}const Kt=new lf;Kt.setAnimationLoop(Ut),this.setAnimationLoop=function(it){xt=it},this.dispose=function(){}}}const Ti=new qn,gM=new ge;function vM(n,t){function e(g,f){g.matrixAutoUpdate===!0&&g.updateMatrix(),f.value.copy(g.matrix)}function i(g,f){f.color.getRGB(g.fogColor.value,tf(n)),f.isFog?(g.fogNear.value=f.near,g.fogFar.value=f.far):f.isFogExp2&&(g.fogDensity.value=f.density)}function r(g,f,P,C,b){f.isMeshBasicMaterial||f.isMeshLambertMaterial?s(g,f):f.isMeshToonMaterial?(s(g,f),h(g,f)):f.isMeshPhongMaterial?(s(g,f),u(g,f)):f.isMeshStandardMaterial?(s(g,f),d(g,f),f.isMeshPhysicalMaterial&&p(g,f,b)):f.isMeshMatcapMaterial?(s(g,f),x(g,f)):f.isMeshDepthMaterial?s(g,f):f.isMeshDistanceMaterial?(s(g,f),S(g,f)):f.isMeshNormalMaterial?s(g,f):f.isLineBasicMaterial?(o(g,f),f.isLineDashedMaterial&&a(g,f)):f.isPointsMaterial?l(g,f,P,C):f.isSpriteMaterial?c(g,f):f.isShadowMaterial?(g.color.value.copy(f.color),g.opacity.value=f.opacity):f.isShaderMaterial&&(f.uniformsNeedUpdate=!1)}function s(g,f){g.opacity.value=f.opacity,f.color&&g.diffuse.value.copy(f.color),f.emissive&&g.emissive.value.copy(f.emissive).multiplyScalar(f.emissiveIntensity),f.map&&(g.map.value=f.map,e(f.map,g.mapTransform)),f.alphaMap&&(g.alphaMap.value=f.alphaMap,e(f.alphaMap,g.alphaMapTransform)),f.bumpMap&&(g.bumpMap.value=f.bumpMap,e(f.bumpMap,g.bumpMapTransform),g.bumpScale.value=f.bumpScale,f.side===We&&(g.bumpScale.value*=-1)),f.normalMap&&(g.normalMap.value=f.normalMap,e(f.normalMap,g.normalMapTransform),g.normalScale.value.copy(f.normalScale),f.side===We&&g.normalScale.value.negate()),f.displacementMap&&(g.displacementMap.value=f.displacementMap,e(f.displacementMap,g.displacementMapTransform),g.displacementScale.value=f.displacementScale,g.displacementBias.value=f.displacementBias),f.emissiveMap&&(g.emissiveMap.value=f.emissiveMap,e(f.emissiveMap,g.emissiveMapTransform)),f.specularMap&&(g.specularMap.value=f.specularMap,e(f.specularMap,g.specularMapTransform)),f.alphaTest>0&&(g.alphaTest.value=f.alphaTest);const P=t.get(f),C=P.envMap,b=P.envMapRotation;C&&(g.envMap.value=C,Ti.copy(b),Ti.x*=-1,Ti.y*=-1,Ti.z*=-1,C.isCubeTexture&&C.isRenderTargetTexture===!1&&(Ti.y*=-1,Ti.z*=-1),g.envMapRotation.value.setFromMatrix4(gM.makeRotationFromEuler(Ti)),g.flipEnvMap.value=C.isCubeTexture&&C.isRenderTargetTexture===!1?-1:1,g.reflectivity.value=f.reflectivity,g.ior.value=f.ior,g.refractionRatio.value=f.refractionRatio),f.lightMap&&(g.lightMap.value=f.lightMap,g.lightMapIntensity.value=f.lightMapIntensity,e(f.lightMap,g.lightMapTransform)),f.aoMap&&(g.aoMap.value=f.aoMap,g.aoMapIntensity.value=f.aoMapIntensity,e(f.aoMap,g.aoMapTransform))}function o(g,f){g.diffuse.value.copy(f.color),g.opacity.value=f.opacity,f.map&&(g.map.value=f.map,e(f.map,g.mapTransform))}function a(g,f){g.dashSize.value=f.dashSize,g.totalSize.value=f.dashSize+f.gapSize,g.scale.value=f.scale}function l(g,f,P,C){g.diffuse.value.copy(f.color),g.opacity.value=f.opacity,g.size.value=f.size*P,g.scale.value=C*.5,f.map&&(g.map.value=f.map,e(f.map,g.uvTransform)),f.alphaMap&&(g.alphaMap.value=f.alphaMap,e(f.alphaMap,g.alphaMapTransform)),f.alphaTest>0&&(g.alphaTest.value=f.alphaTest)}function c(g,f){g.diffuse.value.copy(f.color),g.opacity.value=f.opacity,g.rotation.value=f.rotation,f.map&&(g.map.value=f.map,e(f.map,g.mapTransform)),f.alphaMap&&(g.alphaMap.value=f.alphaMap,e(f.alphaMap,g.alphaMapTransform)),f.alphaTest>0&&(g.alphaTest.value=f.alphaTest)}function u(g,f){g.specular.value.copy(f.specular),g.shininess.value=Math.max(f.shininess,1e-4)}function h(g,f){f.gradientMap&&(g.gradientMap.value=f.gradientMap)}function d(g,f){g.metalness.value=f.metalness,f.metalnessMap&&(g.metalnessMap.value=f.metalnessMap,e(f.metalnessMap,g.metalnessMapTransform)),g.roughness.value=f.roughness,f.roughnessMap&&(g.roughnessMap.value=f.roughnessMap,e(f.roughnessMap,g.roughnessMapTransform)),f.envMap&&(g.envMapIntensity.value=f.envMapIntensity)}function p(g,f,P){g.ior.value=f.ior,f.sheen>0&&(g.sheenColor.value.copy(f.sheenColor).multiplyScalar(f.sheen),g.sheenRoughness.value=f.sheenRoughness,f.sheenColorMap&&(g.sheenColorMap.value=f.sheenColorMap,e(f.sheenColorMap,g.sheenColorMapTransform)),f.sheenRoughnessMap&&(g.sheenRoughnessMap.value=f.sheenRoughnessMap,e(f.sheenRoughnessMap,g.sheenRoughnessMapTransform))),f.clearcoat>0&&(g.clearcoat.value=f.clearcoat,g.clearcoatRoughness.value=f.clearcoatRoughness,f.clearcoatMap&&(g.clearcoatMap.value=f.clearcoatMap,e(f.clearcoatMap,g.clearcoatMapTransform)),f.clearcoatRoughnessMap&&(g.clearcoatRoughnessMap.value=f.clearcoatRoughnessMap,e(f.clearcoatRoughnessMap,g.clearcoatRoughnessMapTransform)),f.clearcoatNormalMap&&(g.clearcoatNormalMap.value=f.clearcoatNormalMap,e(f.clearcoatNormalMap,g.clearcoatNormalMapTransform),g.clearcoatNormalScale.value.copy(f.clearcoatNormalScale),f.side===We&&g.clearcoatNormalScale.value.negate())),f.dispersion>0&&(g.dispersion.value=f.dispersion),f.iridescence>0&&(g.iridescence.value=f.iridescence,g.iridescenceIOR.value=f.iridescenceIOR,g.iridescenceThicknessMinimum.value=f.iridescenceThicknessRange[0],g.iridescenceThicknessMaximum.value=f.iridescenceThicknessRange[1],f.iridescenceMap&&(g.iridescenceMap.value=f.iridescenceMap,e(f.iridescenceMap,g.iridescenceMapTransform)),f.iridescenceThicknessMap&&(g.iridescenceThicknessMap.value=f.iridescenceThicknessMap,e(f.iridescenceThicknessMap,g.iridescenceThicknessMapTransform))),f.transmission>0&&(g.transmission.value=f.transmission,g.transmissionSamplerMap.value=P.texture,g.transmissionSamplerSize.value.set(P.width,P.height),f.transmissionMap&&(g.transmissionMap.value=f.transmissionMap,e(f.transmissionMap,g.transmissionMapTransform)),g.thickness.value=f.thickness,f.thicknessMap&&(g.thicknessMap.value=f.thicknessMap,e(f.thicknessMap,g.thicknessMapTransform)),g.attenuationDistance.value=f.attenuationDistance,g.attenuationColor.value.copy(f.attenuationColor)),f.anisotropy>0&&(g.anisotropyVector.value.set(f.anisotropy*Math.cos(f.anisotropyRotation),f.anisotropy*Math.sin(f.anisotropyRotation)),f.anisotropyMap&&(g.anisotropyMap.value=f.anisotropyMap,e(f.anisotropyMap,g.anisotropyMapTransform))),g.specularIntensity.value=f.specularIntensity,g.specularColor.value.copy(f.specularColor),f.specularColorMap&&(g.specularColorMap.value=f.specularColorMap,e(f.specularColorMap,g.specularColorMapTransform)),f.specularIntensityMap&&(g.specularIntensityMap.value=f.specularIntensityMap,e(f.specularIntensityMap,g.specularIntensityMapTransform))}function x(g,f){f.matcap&&(g.matcap.value=f.matcap)}function S(g,f){const P=t.get(f).light;g.referencePosition.value.setFromMatrixPosition(P.matrixWorld),g.nearDistance.value=P.shadow.camera.near,g.farDistance.value=P.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:r}}function xM(n,t,e,i){let r={},s={},o=[];const a=n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS);function l(P,C){const b=C.program;i.uniformBlockBinding(P,b)}function c(P,C){let b=r[P.id];b===void 0&&(x(P),b=u(P),r[P.id]=b,P.addEventListener("dispose",g));const O=C.program;i.updateUBOMapping(P,O);const F=t.render.frame;s[P.id]!==F&&(d(P),s[P.id]=F)}function u(P){const C=h();P.__bindingPointIndex=C;const b=n.createBuffer(),O=P.__size,F=P.usage;return n.bindBuffer(n.UNIFORM_BUFFER,b),n.bufferData(n.UNIFORM_BUFFER,O,F),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,C,b),b}function h(){for(let P=0;P<a;P++)if(o.indexOf(P)===-1)return o.push(P),P;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(P){const C=r[P.id],b=P.uniforms,O=P.__cache;n.bindBuffer(n.UNIFORM_BUFFER,C);for(let F=0,L=b.length;F<L;F++){const V=Array.isArray(b[F])?b[F]:[b[F]];for(let w=0,T=V.length;w<T;w++){const U=V[w];if(p(U,F,w,O)===!0){const rt=U.__offset,Z=Array.isArray(U.value)?U.value:[U.value];let ot=0;for(let at=0;at<Z.length;at++){const et=Z[at],nt=S(et);typeof et=="number"||typeof et=="boolean"?(U.__data[0]=et,n.bufferSubData(n.UNIFORM_BUFFER,rt+ot,U.__data)):et.isMatrix3?(U.__data[0]=et.elements[0],U.__data[1]=et.elements[1],U.__data[2]=et.elements[2],U.__data[3]=0,U.__data[4]=et.elements[3],U.__data[5]=et.elements[4],U.__data[6]=et.elements[5],U.__data[7]=0,U.__data[8]=et.elements[6],U.__data[9]=et.elements[7],U.__data[10]=et.elements[8],U.__data[11]=0):(et.toArray(U.__data,ot),ot+=nt.storage/Float32Array.BYTES_PER_ELEMENT)}n.bufferSubData(n.UNIFORM_BUFFER,rt,U.__data)}}}n.bindBuffer(n.UNIFORM_BUFFER,null)}function p(P,C,b,O){const F=P.value,L=C+"_"+b;if(O[L]===void 0)return typeof F=="number"||typeof F=="boolean"?O[L]=F:O[L]=F.clone(),!0;{const V=O[L];if(typeof F=="number"||typeof F=="boolean"){if(V!==F)return O[L]=F,!0}else if(V.equals(F)===!1)return V.copy(F),!0}return!1}function x(P){const C=P.uniforms;let b=0;const O=16;for(let L=0,V=C.length;L<V;L++){const w=Array.isArray(C[L])?C[L]:[C[L]];for(let T=0,U=w.length;T<U;T++){const rt=w[T],Z=Array.isArray(rt.value)?rt.value:[rt.value];for(let ot=0,at=Z.length;ot<at;ot++){const et=Z[ot],nt=S(et),G=b%O,mt=G%nt.boundary,St=G+mt;b+=mt,St!==0&&O-St<nt.storage&&(b+=O-St),rt.__data=new Float32Array(nt.storage/Float32Array.BYTES_PER_ELEMENT),rt.__offset=b,b+=nt.storage}}}const F=b%O;return F>0&&(b+=O-F),P.__size=b,P.__cache={},this}function S(P){const C={boundary:0,storage:0};return typeof P=="number"||typeof P=="boolean"?(C.boundary=4,C.storage=4):P.isVector2?(C.boundary=8,C.storage=8):P.isVector3||P.isColor?(C.boundary=16,C.storage=12):P.isVector4?(C.boundary=16,C.storage=16):P.isMatrix3?(C.boundary=48,C.storage=48):P.isMatrix4?(C.boundary=64,C.storage=64):P.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",P),C}function g(P){const C=P.target;C.removeEventListener("dispose",g);const b=o.indexOf(C.__bindingPointIndex);o.splice(b,1),n.deleteBuffer(r[C.id]),delete r[C.id],delete s[C.id]}function f(){for(const P in r)n.deleteBuffer(r[P]);o=[],r={},s={}}return{bind:l,update:c,dispose:f}}class MM{constructor(t={}){const{canvas:e=i_(),context:i=null,depth:r=!0,stencil:s=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:h=!1,reverseDepthBuffer:d=!1}=t;this.isWebGLRenderer=!0;let p;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");p=i.getContextAttributes().alpha}else p=o;const x=new Uint32Array(4),S=new Int32Array(4);let g=null,f=null;const P=[],C=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=on,this.toneMapping=hi,this.toneMappingExposure=1;const b=this;let O=!1,F=0,L=0,V=null,w=-1,T=null;const U=new ve,rt=new ve;let Z=null;const ot=new ee(0);let at=0,et=e.width,nt=e.height,G=1,mt=null,St=null;const xt=new ve(0,0,et,nt),Ut=new ve(0,0,et,nt);let Kt=!1;const it=new rf;let ft=!1,At=!1;const gt=new ge,Dt=new ge,Ft=new k,Bt=new ve,Zt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let qt=!1;function R(){return V===null?G:1}let v=i;function $(E,B){return e.getContext(E,B)}try{const E={alpha:!0,depth:r,stencil:s,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:u,failIfMajorPerformanceCaveat:h};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${Nl}`),e.addEventListener("webglcontextlost",st,!1),e.addEventListener("webglcontextrestored",Mt,!1),e.addEventListener("webglcontextcreationerror",vt,!1),v===null){const B="webgl2";if(v=$(B,E),v===null)throw $(B)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(E){throw console.error("THREE.WebGLRenderer: "+E.message),E}let tt,J,W,ct,Q,M,_,D,m,y,A,I,z,Y,ht,X,lt,ut,Et,dt,wt,Rt,Ot,N;function _t(){tt=new C0(v),tt.init(),Rt=new hM(v,tt),J=new y0(v,tt,t,Rt),W=new cM(v,tt),J.reverseDepthBuffer&&d&&W.buffers.depth.setReversed(!0),ct=new L0(v),Q=new $x,M=new uM(v,tt,W,Q,J,Rt,ct),_=new b0(b),D=new R0(b),m=new z_(v),Ot=new S0(v,m),y=new P0(v,m,ct,Ot),A=new U0(v,y,m,ct),Et=new I0(v,J,M),X=new T0(Q),I=new Kx(b,_,D,tt,J,Ot,X),z=new vM(b,Q),Y=new Jx,ht=new rM(tt),ut=new M0(b,_,D,W,A,p,l),lt=new aM(b,A,J),N=new xM(v,ct,J,W),dt=new E0(v,tt,ct),wt=new D0(v,tt,ct),ct.programs=I.programs,b.capabilities=J,b.extensions=tt,b.properties=Q,b.renderLists=Y,b.shadowMap=lt,b.state=W,b.info=ct}_t();const j=new _M(b,v);this.xr=j,this.getContext=function(){return v},this.getContextAttributes=function(){return v.getContextAttributes()},this.forceContextLoss=function(){const E=tt.get("WEBGL_lose_context");E&&E.loseContext()},this.forceContextRestore=function(){const E=tt.get("WEBGL_lose_context");E&&E.restoreContext()},this.getPixelRatio=function(){return G},this.setPixelRatio=function(E){E!==void 0&&(G=E,this.setSize(et,nt,!1))},this.getSize=function(E){return E.set(et,nt)},this.setSize=function(E,B,q=!0){if(j.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}et=E,nt=B,e.width=Math.floor(E*G),e.height=Math.floor(B*G),q===!0&&(e.style.width=E+"px",e.style.height=B+"px"),this.setViewport(0,0,E,B)},this.getDrawingBufferSize=function(E){return E.set(et*G,nt*G).floor()},this.setDrawingBufferSize=function(E,B,q){et=E,nt=B,G=q,e.width=Math.floor(E*q),e.height=Math.floor(B*q),this.setViewport(0,0,E,B)},this.getCurrentViewport=function(E){return E.copy(U)},this.getViewport=function(E){return E.copy(xt)},this.setViewport=function(E,B,q,K){E.isVector4?xt.set(E.x,E.y,E.z,E.w):xt.set(E,B,q,K),W.viewport(U.copy(xt).multiplyScalar(G).round())},this.getScissor=function(E){return E.copy(Ut)},this.setScissor=function(E,B,q,K){E.isVector4?Ut.set(E.x,E.y,E.z,E.w):Ut.set(E,B,q,K),W.scissor(rt.copy(Ut).multiplyScalar(G).round())},this.getScissorTest=function(){return Kt},this.setScissorTest=function(E){W.setScissorTest(Kt=E)},this.setOpaqueSort=function(E){mt=E},this.setTransparentSort=function(E){St=E},this.getClearColor=function(E){return E.copy(ut.getClearColor())},this.setClearColor=function(){ut.setClearColor.apply(ut,arguments)},this.getClearAlpha=function(){return ut.getClearAlpha()},this.setClearAlpha=function(){ut.setClearAlpha.apply(ut,arguments)},this.clear=function(E=!0,B=!0,q=!0){let K=0;if(E){let H=!1;if(V!==null){const pt=V.texture.format;H=pt===Vl||pt===Hl||pt===zl}if(H){const pt=V.texture.type,Tt=pt===Xn||pt===Ii||pt===Jr||pt===gr||pt===Ol||pt===Bl,Ct=ut.getClearColor(),Pt=ut.getClearAlpha(),zt=Ct.r,Ht=Ct.g,Lt=Ct.b;Tt?(x[0]=zt,x[1]=Ht,x[2]=Lt,x[3]=Pt,v.clearBufferuiv(v.COLOR,0,x)):(S[0]=zt,S[1]=Ht,S[2]=Lt,S[3]=Pt,v.clearBufferiv(v.COLOR,0,S))}else K|=v.COLOR_BUFFER_BIT}B&&(K|=v.DEPTH_BUFFER_BIT),q&&(K|=v.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),v.clear(K)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",st,!1),e.removeEventListener("webglcontextrestored",Mt,!1),e.removeEventListener("webglcontextcreationerror",vt,!1),ut.dispose(),Y.dispose(),ht.dispose(),Q.dispose(),_.dispose(),D.dispose(),A.dispose(),Ot.dispose(),N.dispose(),I.dispose(),j.dispose(),j.removeEventListener("sessionstart",ql),j.removeEventListener("sessionend",Yl),mi.stop()};function st(E){E.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),O=!0}function Mt(){console.log("THREE.WebGLRenderer: Context Restored."),O=!1;const E=ct.autoReset,B=lt.enabled,q=lt.autoUpdate,K=lt.needsUpdate,H=lt.type;_t(),ct.autoReset=E,lt.enabled=B,lt.autoUpdate=q,lt.needsUpdate=K,lt.type=H}function vt(E){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",E.statusMessage)}function Vt(E){const B=E.target;B.removeEventListener("dispose",Vt),pe(B)}function pe(E){Ee(E),Q.remove(E)}function Ee(E){const B=Q.get(E).programs;B!==void 0&&(B.forEach(function(q){I.releaseProgram(q)}),E.isShaderMaterial&&I.releaseShaderCache(E))}this.renderBufferDirect=function(E,B,q,K,H,pt){B===null&&(B=Zt);const Tt=H.isMesh&&H.matrixWorld.determinant()<0,Ct=vf(E,B,q,K,H);W.setMaterial(K,Tt);let Pt=q.index,zt=1;if(K.wireframe===!0){if(Pt=y.getWireframeAttribute(q),Pt===void 0)return;zt=2}const Ht=q.drawRange,Lt=q.attributes.position;let $t=Ht.start*zt,ne=(Ht.start+Ht.count)*zt;pt!==null&&($t=Math.max($t,pt.start*zt),ne=Math.min(ne,(pt.start+pt.count)*zt)),Pt!==null?($t=Math.max($t,0),ne=Math.min(ne,Pt.count)):Lt!=null&&($t=Math.max($t,0),ne=Math.min(ne,Lt.count));const xe=ne-$t;if(xe<0||xe===1/0)return;Ot.setup(H,K,Ct,q,Pt);let me,Jt=dt;if(Pt!==null&&(me=m.get(Pt),Jt=wt,Jt.setIndex(me)),H.isMesh)K.wireframe===!0?(W.setLineWidth(K.wireframeLinewidth*R()),Jt.setMode(v.LINES)):Jt.setMode(v.TRIANGLES);else if(H.isLine){let It=K.linewidth;It===void 0&&(It=1),W.setLineWidth(It*R()),H.isLineSegments?Jt.setMode(v.LINES):H.isLineLoop?Jt.setMode(v.LINE_LOOP):Jt.setMode(v.LINE_STRIP)}else H.isPoints?Jt.setMode(v.POINTS):H.isSprite&&Jt.setMode(v.TRIANGLES);if(H.isBatchedMesh)if(H._multiDrawInstances!==null)Jt.renderMultiDrawInstances(H._multiDrawStarts,H._multiDrawCounts,H._multiDrawCount,H._multiDrawInstances);else if(tt.get("WEBGL_multi_draw"))Jt.renderMultiDraw(H._multiDrawStarts,H._multiDrawCounts,H._multiDrawCount);else{const It=H._multiDrawStarts,Re=H._multiDrawCounts,ie=H._multiDrawCount,un=Pt?m.get(Pt).bytesPerElement:1,Bi=Q.get(K).currentProgram.getUniforms();for(let qe=0;qe<ie;qe++)Bi.setValue(v,"_gl_DrawID",qe),Jt.render(It[qe]/un,Re[qe])}else if(H.isInstancedMesh)Jt.renderInstances($t,xe,H.count);else if(q.isInstancedBufferGeometry){const It=q._maxInstanceCount!==void 0?q._maxInstanceCount:1/0,Re=Math.min(q.instanceCount,It);Jt.renderInstances($t,xe,Re)}else Jt.render($t,xe)};function se(E,B,q){E.transparent===!0&&E.side===Hn&&E.forceSinglePass===!1?(E.side=We,E.needsUpdate=!0,ls(E,B,q),E.side=fi,E.needsUpdate=!0,ls(E,B,q),E.side=Hn):ls(E,B,q)}this.compile=function(E,B,q=null){q===null&&(q=E),f=ht.get(q),f.init(B),C.push(f),q.traverseVisible(function(H){H.isLight&&H.layers.test(B.layers)&&(f.pushLight(H),H.castShadow&&f.pushShadow(H))}),E!==q&&E.traverseVisible(function(H){H.isLight&&H.layers.test(B.layers)&&(f.pushLight(H),H.castShadow&&f.pushShadow(H))}),f.setupLights();const K=new Set;return E.traverse(function(H){if(!(H.isMesh||H.isPoints||H.isLine||H.isSprite))return;const pt=H.material;if(pt)if(Array.isArray(pt))for(let Tt=0;Tt<pt.length;Tt++){const Ct=pt[Tt];se(Ct,q,H),K.add(Ct)}else se(pt,q,H),K.add(pt)}),C.pop(),f=null,K},this.compileAsync=function(E,B,q=null){const K=this.compile(E,B,q);return new Promise(H=>{function pt(){if(K.forEach(function(Tt){Q.get(Tt).currentProgram.isReady()&&K.delete(Tt)}),K.size===0){H(E);return}setTimeout(pt,10)}tt.get("KHR_parallel_shader_compile")!==null?pt():setTimeout(pt,10)})};let cn=null;function Cn(E){cn&&cn(E)}function ql(){mi.stop()}function Yl(){mi.start()}const mi=new lf;mi.setAnimationLoop(Cn),typeof self<"u"&&mi.setContext(self),this.setAnimationLoop=function(E){cn=E,j.setAnimationLoop(E),E===null?mi.stop():mi.start()},j.addEventListener("sessionstart",ql),j.addEventListener("sessionend",Yl),this.render=function(E,B){if(B!==void 0&&B.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(O===!0)return;if(E.matrixWorldAutoUpdate===!0&&E.updateMatrixWorld(),B.parent===null&&B.matrixWorldAutoUpdate===!0&&B.updateMatrixWorld(),j.enabled===!0&&j.isPresenting===!0&&(j.cameraAutoUpdate===!0&&j.updateCamera(B),B=j.getCamera()),E.isScene===!0&&E.onBeforeRender(b,E,B,V),f=ht.get(E,C.length),f.init(B),C.push(f),Dt.multiplyMatrices(B.projectionMatrix,B.matrixWorldInverse),it.setFromProjectionMatrix(Dt),At=this.localClippingEnabled,ft=X.init(this.clippingPlanes,At),g=Y.get(E,P.length),g.init(),P.push(g),j.enabled===!0&&j.isPresenting===!0){const pt=b.xr.getDepthSensingMesh();pt!==null&&xo(pt,B,-1/0,b.sortObjects)}xo(E,B,0,b.sortObjects),g.finish(),b.sortObjects===!0&&g.sort(mt,St),qt=j.enabled===!1||j.isPresenting===!1||j.hasDepthSensing()===!1,qt&&ut.addToRenderList(g,E),this.info.render.frame++,ft===!0&&X.beginShadows();const q=f.state.shadowsArray;lt.render(q,E,B),ft===!0&&X.endShadows(),this.info.autoReset===!0&&this.info.reset();const K=g.opaque,H=g.transmissive;if(f.setupLights(),B.isArrayCamera){const pt=B.cameras;if(H.length>0)for(let Tt=0,Ct=pt.length;Tt<Ct;Tt++){const Pt=pt[Tt];Kl(K,H,E,Pt)}qt&&ut.render(E);for(let Tt=0,Ct=pt.length;Tt<Ct;Tt++){const Pt=pt[Tt];jl(g,E,Pt,Pt.viewport)}}else H.length>0&&Kl(K,H,E,B),qt&&ut.render(E),jl(g,E,B);V!==null&&(M.updateMultisampleRenderTarget(V),M.updateRenderTargetMipmap(V)),E.isScene===!0&&E.onAfterRender(b,E,B),Ot.resetDefaultState(),w=-1,T=null,C.pop(),C.length>0?(f=C[C.length-1],ft===!0&&X.setGlobalState(b.clippingPlanes,f.state.camera)):f=null,P.pop(),P.length>0?g=P[P.length-1]:g=null};function xo(E,B,q,K){if(E.visible===!1)return;if(E.layers.test(B.layers)){if(E.isGroup)q=E.renderOrder;else if(E.isLOD)E.autoUpdate===!0&&E.update(B);else if(E.isLight)f.pushLight(E),E.castShadow&&f.pushShadow(E);else if(E.isSprite){if(!E.frustumCulled||it.intersectsSprite(E)){K&&Bt.setFromMatrixPosition(E.matrixWorld).applyMatrix4(Dt);const Tt=A.update(E),Ct=E.material;Ct.visible&&g.push(E,Tt,Ct,q,Bt.z,null)}}else if((E.isMesh||E.isLine||E.isPoints)&&(!E.frustumCulled||it.intersectsObject(E))){const Tt=A.update(E),Ct=E.material;if(K&&(E.boundingSphere!==void 0?(E.boundingSphere===null&&E.computeBoundingSphere(),Bt.copy(E.boundingSphere.center)):(Tt.boundingSphere===null&&Tt.computeBoundingSphere(),Bt.copy(Tt.boundingSphere.center)),Bt.applyMatrix4(E.matrixWorld).applyMatrix4(Dt)),Array.isArray(Ct)){const Pt=Tt.groups;for(let zt=0,Ht=Pt.length;zt<Ht;zt++){const Lt=Pt[zt],$t=Ct[Lt.materialIndex];$t&&$t.visible&&g.push(E,Tt,$t,q,Bt.z,Lt)}}else Ct.visible&&g.push(E,Tt,Ct,q,Bt.z,null)}}const pt=E.children;for(let Tt=0,Ct=pt.length;Tt<Ct;Tt++)xo(pt[Tt],B,q,K)}function jl(E,B,q,K){const H=E.opaque,pt=E.transmissive,Tt=E.transparent;f.setupLightsView(q),ft===!0&&X.setGlobalState(b.clippingPlanes,q),K&&W.viewport(U.copy(K)),H.length>0&&as(H,B,q),pt.length>0&&as(pt,B,q),Tt.length>0&&as(Tt,B,q),W.buffers.depth.setTest(!0),W.buffers.depth.setMask(!0),W.buffers.color.setMask(!0),W.setPolygonOffset(!1)}function Kl(E,B,q,K){if((q.isScene===!0?q.overrideMaterial:null)!==null)return;f.state.transmissionRenderTarget[K.id]===void 0&&(f.state.transmissionRenderTarget[K.id]=new Ui(1,1,{generateMipmaps:!0,type:tt.has("EXT_color_buffer_half_float")||tt.has("EXT_color_buffer_float")?is:Xn,minFilter:Pi,samples:4,stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Qt.workingColorSpace}));const pt=f.state.transmissionRenderTarget[K.id],Tt=K.viewport||U;pt.setSize(Tt.z,Tt.w);const Ct=b.getRenderTarget();b.setRenderTarget(pt),b.getClearColor(ot),at=b.getClearAlpha(),at<1&&b.setClearColor(16777215,.5),b.clear(),qt&&ut.render(q);const Pt=b.toneMapping;b.toneMapping=hi;const zt=K.viewport;if(K.viewport!==void 0&&(K.viewport=void 0),f.setupLightsView(K),ft===!0&&X.setGlobalState(b.clippingPlanes,K),as(E,q,K),M.updateMultisampleRenderTarget(pt),M.updateRenderTargetMipmap(pt),tt.has("WEBGL_multisampled_render_to_texture")===!1){let Ht=!1;for(let Lt=0,$t=B.length;Lt<$t;Lt++){const ne=B[Lt],xe=ne.object,me=ne.geometry,Jt=ne.material,It=ne.group;if(Jt.side===Hn&&xe.layers.test(K.layers)){const Re=Jt.side;Jt.side=We,Jt.needsUpdate=!0,$l(xe,q,K,me,Jt,It),Jt.side=Re,Jt.needsUpdate=!0,Ht=!0}}Ht===!0&&(M.updateMultisampleRenderTarget(pt),M.updateRenderTargetMipmap(pt))}b.setRenderTarget(Ct),b.setClearColor(ot,at),zt!==void 0&&(K.viewport=zt),b.toneMapping=Pt}function as(E,B,q){const K=B.isScene===!0?B.overrideMaterial:null;for(let H=0,pt=E.length;H<pt;H++){const Tt=E[H],Ct=Tt.object,Pt=Tt.geometry,zt=K===null?Tt.material:K,Ht=Tt.group;Ct.layers.test(q.layers)&&$l(Ct,B,q,Pt,zt,Ht)}}function $l(E,B,q,K,H,pt){E.onBeforeRender(b,B,q,K,H,pt),E.modelViewMatrix.multiplyMatrices(q.matrixWorldInverse,E.matrixWorld),E.normalMatrix.getNormalMatrix(E.modelViewMatrix),H.onBeforeRender(b,B,q,K,E,pt),H.transparent===!0&&H.side===Hn&&H.forceSinglePass===!1?(H.side=We,H.needsUpdate=!0,b.renderBufferDirect(q,B,K,H,E,pt),H.side=fi,H.needsUpdate=!0,b.renderBufferDirect(q,B,K,H,E,pt),H.side=Hn):b.renderBufferDirect(q,B,K,H,E,pt),E.onAfterRender(b,B,q,K,H,pt)}function ls(E,B,q){B.isScene!==!0&&(B=Zt);const K=Q.get(E),H=f.state.lights,pt=f.state.shadowsArray,Tt=H.state.version,Ct=I.getParameters(E,H.state,pt,B,q),Pt=I.getProgramCacheKey(Ct);let zt=K.programs;K.environment=E.isMeshStandardMaterial?B.environment:null,K.fog=B.fog,K.envMap=(E.isMeshStandardMaterial?D:_).get(E.envMap||K.environment),K.envMapRotation=K.environment!==null&&E.envMap===null?B.environmentRotation:E.envMapRotation,zt===void 0&&(E.addEventListener("dispose",Vt),zt=new Map,K.programs=zt);let Ht=zt.get(Pt);if(Ht!==void 0){if(K.currentProgram===Ht&&K.lightsStateVersion===Tt)return Jl(E,Ct),Ht}else Ct.uniforms=I.getUniforms(E),E.onBeforeCompile(Ct,b),Ht=I.acquireProgram(Ct,Pt),zt.set(Pt,Ht),K.uniforms=Ct.uniforms;const Lt=K.uniforms;return(!E.isShaderMaterial&&!E.isRawShaderMaterial||E.clipping===!0)&&(Lt.clippingPlanes=X.uniform),Jl(E,Ct),K.needsLights=Mf(E),K.lightsStateVersion=Tt,K.needsLights&&(Lt.ambientLightColor.value=H.state.ambient,Lt.lightProbe.value=H.state.probe,Lt.directionalLights.value=H.state.directional,Lt.directionalLightShadows.value=H.state.directionalShadow,Lt.spotLights.value=H.state.spot,Lt.spotLightShadows.value=H.state.spotShadow,Lt.rectAreaLights.value=H.state.rectArea,Lt.ltc_1.value=H.state.rectAreaLTC1,Lt.ltc_2.value=H.state.rectAreaLTC2,Lt.pointLights.value=H.state.point,Lt.pointLightShadows.value=H.state.pointShadow,Lt.hemisphereLights.value=H.state.hemi,Lt.directionalShadowMap.value=H.state.directionalShadowMap,Lt.directionalShadowMatrix.value=H.state.directionalShadowMatrix,Lt.spotShadowMap.value=H.state.spotShadowMap,Lt.spotLightMatrix.value=H.state.spotLightMatrix,Lt.spotLightMap.value=H.state.spotLightMap,Lt.pointShadowMap.value=H.state.pointShadowMap,Lt.pointShadowMatrix.value=H.state.pointShadowMatrix),K.currentProgram=Ht,K.uniformsList=null,Ht}function Zl(E){if(E.uniformsList===null){const B=E.currentProgram.getUniforms();E.uniformsList=Ys.seqWithValue(B.seq,E.uniforms)}return E.uniformsList}function Jl(E,B){const q=Q.get(E);q.outputColorSpace=B.outputColorSpace,q.batching=B.batching,q.batchingColor=B.batchingColor,q.instancing=B.instancing,q.instancingColor=B.instancingColor,q.instancingMorph=B.instancingMorph,q.skinning=B.skinning,q.morphTargets=B.morphTargets,q.morphNormals=B.morphNormals,q.morphColors=B.morphColors,q.morphTargetsCount=B.morphTargetsCount,q.numClippingPlanes=B.numClippingPlanes,q.numIntersection=B.numClipIntersection,q.vertexAlphas=B.vertexAlphas,q.vertexTangents=B.vertexTangents,q.toneMapping=B.toneMapping}function vf(E,B,q,K,H){B.isScene!==!0&&(B=Zt),M.resetTextureUnits();const pt=B.fog,Tt=K.isMeshStandardMaterial?B.environment:null,Ct=V===null?b.outputColorSpace:V.isXRRenderTarget===!0?V.texture.colorSpace:xr,Pt=(K.isMeshStandardMaterial?D:_).get(K.envMap||Tt),zt=K.vertexColors===!0&&!!q.attributes.color&&q.attributes.color.itemSize===4,Ht=!!q.attributes.tangent&&(!!K.normalMap||K.anisotropy>0),Lt=!!q.morphAttributes.position,$t=!!q.morphAttributes.normal,ne=!!q.morphAttributes.color;let xe=hi;K.toneMapped&&(V===null||V.isXRRenderTarget===!0)&&(xe=b.toneMapping);const me=q.morphAttributes.position||q.morphAttributes.normal||q.morphAttributes.color,Jt=me!==void 0?me.length:0,It=Q.get(K),Re=f.state.lights;if(ft===!0&&(At===!0||E!==T)){const Ne=E===T&&K.id===w;X.setState(K,E,Ne)}let ie=!1;K.version===It.__version?(It.needsLights&&It.lightsStateVersion!==Re.state.version||It.outputColorSpace!==Ct||H.isBatchedMesh&&It.batching===!1||!H.isBatchedMesh&&It.batching===!0||H.isBatchedMesh&&It.batchingColor===!0&&H.colorTexture===null||H.isBatchedMesh&&It.batchingColor===!1&&H.colorTexture!==null||H.isInstancedMesh&&It.instancing===!1||!H.isInstancedMesh&&It.instancing===!0||H.isSkinnedMesh&&It.skinning===!1||!H.isSkinnedMesh&&It.skinning===!0||H.isInstancedMesh&&It.instancingColor===!0&&H.instanceColor===null||H.isInstancedMesh&&It.instancingColor===!1&&H.instanceColor!==null||H.isInstancedMesh&&It.instancingMorph===!0&&H.morphTexture===null||H.isInstancedMesh&&It.instancingMorph===!1&&H.morphTexture!==null||It.envMap!==Pt||K.fog===!0&&It.fog!==pt||It.numClippingPlanes!==void 0&&(It.numClippingPlanes!==X.numPlanes||It.numIntersection!==X.numIntersection)||It.vertexAlphas!==zt||It.vertexTangents!==Ht||It.morphTargets!==Lt||It.morphNormals!==$t||It.morphColors!==ne||It.toneMapping!==xe||It.morphTargetsCount!==Jt)&&(ie=!0):(ie=!0,It.__version=K.version);let un=It.currentProgram;ie===!0&&(un=ls(K,B,H));let Bi=!1,qe=!1,br=!1;const fe=un.getUniforms(),en=It.uniforms;if(W.useProgram(un.program)&&(Bi=!0,qe=!0,br=!0),K.id!==w&&(w=K.id,qe=!0),Bi||T!==E){W.buffers.depth.getReversed()?(gt.copy(E.projectionMatrix),s_(gt),o_(gt),fe.setValue(v,"projectionMatrix",gt)):fe.setValue(v,"projectionMatrix",E.projectionMatrix),fe.setValue(v,"viewMatrix",E.matrixWorldInverse);const Ge=fe.map.cameraPosition;Ge!==void 0&&Ge.setValue(v,Ft.setFromMatrixPosition(E.matrixWorld)),J.logarithmicDepthBuffer&&fe.setValue(v,"logDepthBufFC",2/(Math.log(E.far+1)/Math.LN2)),(K.isMeshPhongMaterial||K.isMeshToonMaterial||K.isMeshLambertMaterial||K.isMeshBasicMaterial||K.isMeshStandardMaterial||K.isShaderMaterial)&&fe.setValue(v,"isOrthographic",E.isOrthographicCamera===!0),T!==E&&(T=E,qe=!0,br=!0)}if(H.isSkinnedMesh){fe.setOptional(v,H,"bindMatrix"),fe.setOptional(v,H,"bindMatrixInverse");const Ne=H.skeleton;Ne&&(Ne.boneTexture===null&&Ne.computeBoneTexture(),fe.setValue(v,"boneTexture",Ne.boneTexture,M))}H.isBatchedMesh&&(fe.setOptional(v,H,"batchingTexture"),fe.setValue(v,"batchingTexture",H._matricesTexture,M),fe.setOptional(v,H,"batchingIdTexture"),fe.setValue(v,"batchingIdTexture",H._indirectTexture,M),fe.setOptional(v,H,"batchingColorTexture"),H._colorsTexture!==null&&fe.setValue(v,"batchingColorTexture",H._colorsTexture,M));const nn=q.morphAttributes;if((nn.position!==void 0||nn.normal!==void 0||nn.color!==void 0)&&Et.update(H,q,un),(qe||It.receiveShadow!==H.receiveShadow)&&(It.receiveShadow=H.receiveShadow,fe.setValue(v,"receiveShadow",H.receiveShadow)),K.isMeshGouraudMaterial&&K.envMap!==null&&(en.envMap.value=Pt,en.flipEnvMap.value=Pt.isCubeTexture&&Pt.isRenderTargetTexture===!1?-1:1),K.isMeshStandardMaterial&&K.envMap===null&&B.environment!==null&&(en.envMapIntensity.value=B.environmentIntensity),qe&&(fe.setValue(v,"toneMappingExposure",b.toneMappingExposure),It.needsLights&&xf(en,br),pt&&K.fog===!0&&z.refreshFogUniforms(en,pt),z.refreshMaterialUniforms(en,K,G,nt,f.state.transmissionRenderTarget[E.id]),Ys.upload(v,Zl(It),en,M)),K.isShaderMaterial&&K.uniformsNeedUpdate===!0&&(Ys.upload(v,Zl(It),en,M),K.uniformsNeedUpdate=!1),K.isSpriteMaterial&&fe.setValue(v,"center",H.center),fe.setValue(v,"modelViewMatrix",H.modelViewMatrix),fe.setValue(v,"normalMatrix",H.normalMatrix),fe.setValue(v,"modelMatrix",H.matrixWorld),K.isShaderMaterial||K.isRawShaderMaterial){const Ne=K.uniformsGroups;for(let Ge=0,Mo=Ne.length;Ge<Mo;Ge++){const _i=Ne[Ge];N.update(_i,un),N.bind(_i,un)}}return un}function xf(E,B){E.ambientLightColor.needsUpdate=B,E.lightProbe.needsUpdate=B,E.directionalLights.needsUpdate=B,E.directionalLightShadows.needsUpdate=B,E.pointLights.needsUpdate=B,E.pointLightShadows.needsUpdate=B,E.spotLights.needsUpdate=B,E.spotLightShadows.needsUpdate=B,E.rectAreaLights.needsUpdate=B,E.hemisphereLights.needsUpdate=B}function Mf(E){return E.isMeshLambertMaterial||E.isMeshToonMaterial||E.isMeshPhongMaterial||E.isMeshStandardMaterial||E.isShadowMaterial||E.isShaderMaterial&&E.lights===!0}this.getActiveCubeFace=function(){return F},this.getActiveMipmapLevel=function(){return L},this.getRenderTarget=function(){return V},this.setRenderTargetTextures=function(E,B,q){Q.get(E.texture).__webglTexture=B,Q.get(E.depthTexture).__webglTexture=q;const K=Q.get(E);K.__hasExternalTextures=!0,K.__autoAllocateDepthBuffer=q===void 0,K.__autoAllocateDepthBuffer||tt.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),K.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(E,B){const q=Q.get(E);q.__webglFramebuffer=B,q.__useDefaultFramebuffer=B===void 0},this.setRenderTarget=function(E,B=0,q=0){V=E,F=B,L=q;let K=!0,H=null,pt=!1,Tt=!1;if(E){const Pt=Q.get(E);if(Pt.__useDefaultFramebuffer!==void 0)W.bindFramebuffer(v.FRAMEBUFFER,null),K=!1;else if(Pt.__webglFramebuffer===void 0)M.setupRenderTarget(E);else if(Pt.__hasExternalTextures)M.rebindTextures(E,Q.get(E.texture).__webglTexture,Q.get(E.depthTexture).__webglTexture);else if(E.depthBuffer){const Lt=E.depthTexture;if(Pt.__boundDepthTexture!==Lt){if(Lt!==null&&Q.has(Lt)&&(E.width!==Lt.image.width||E.height!==Lt.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");M.setupDepthRenderbuffer(E)}}const zt=E.texture;(zt.isData3DTexture||zt.isDataArrayTexture||zt.isCompressedArrayTexture)&&(Tt=!0);const Ht=Q.get(E).__webglFramebuffer;E.isWebGLCubeRenderTarget?(Array.isArray(Ht[B])?H=Ht[B][q]:H=Ht[B],pt=!0):E.samples>0&&M.useMultisampledRTT(E)===!1?H=Q.get(E).__webglMultisampledFramebuffer:Array.isArray(Ht)?H=Ht[q]:H=Ht,U.copy(E.viewport),rt.copy(E.scissor),Z=E.scissorTest}else U.copy(xt).multiplyScalar(G).floor(),rt.copy(Ut).multiplyScalar(G).floor(),Z=Kt;if(W.bindFramebuffer(v.FRAMEBUFFER,H)&&K&&W.drawBuffers(E,H),W.viewport(U),W.scissor(rt),W.setScissorTest(Z),pt){const Pt=Q.get(E.texture);v.framebufferTexture2D(v.FRAMEBUFFER,v.COLOR_ATTACHMENT0,v.TEXTURE_CUBE_MAP_POSITIVE_X+B,Pt.__webglTexture,q)}else if(Tt){const Pt=Q.get(E.texture),zt=B||0;v.framebufferTextureLayer(v.FRAMEBUFFER,v.COLOR_ATTACHMENT0,Pt.__webglTexture,q||0,zt)}w=-1},this.readRenderTargetPixels=function(E,B,q,K,H,pt,Tt){if(!(E&&E.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Ct=Q.get(E).__webglFramebuffer;if(E.isWebGLCubeRenderTarget&&Tt!==void 0&&(Ct=Ct[Tt]),Ct){W.bindFramebuffer(v.FRAMEBUFFER,Ct);try{const Pt=E.texture,zt=Pt.format,Ht=Pt.type;if(!J.textureFormatReadable(zt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!J.textureTypeReadable(Ht)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}B>=0&&B<=E.width-K&&q>=0&&q<=E.height-H&&v.readPixels(B,q,K,H,Rt.convert(zt),Rt.convert(Ht),pt)}finally{const Pt=V!==null?Q.get(V).__webglFramebuffer:null;W.bindFramebuffer(v.FRAMEBUFFER,Pt)}}},this.readRenderTargetPixelsAsync=async function(E,B,q,K,H,pt,Tt){if(!(E&&E.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Ct=Q.get(E).__webglFramebuffer;if(E.isWebGLCubeRenderTarget&&Tt!==void 0&&(Ct=Ct[Tt]),Ct){const Pt=E.texture,zt=Pt.format,Ht=Pt.type;if(!J.textureFormatReadable(zt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!J.textureTypeReadable(Ht))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(B>=0&&B<=E.width-K&&q>=0&&q<=E.height-H){W.bindFramebuffer(v.FRAMEBUFFER,Ct);const Lt=v.createBuffer();v.bindBuffer(v.PIXEL_PACK_BUFFER,Lt),v.bufferData(v.PIXEL_PACK_BUFFER,pt.byteLength,v.STREAM_READ),v.readPixels(B,q,K,H,Rt.convert(zt),Rt.convert(Ht),0);const $t=V!==null?Q.get(V).__webglFramebuffer:null;W.bindFramebuffer(v.FRAMEBUFFER,$t);const ne=v.fenceSync(v.SYNC_GPU_COMMANDS_COMPLETE,0);return v.flush(),await r_(v,ne,4),v.bindBuffer(v.PIXEL_PACK_BUFFER,Lt),v.getBufferSubData(v.PIXEL_PACK_BUFFER,0,pt),v.deleteBuffer(Lt),v.deleteSync(ne),pt}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(E,B=null,q=0){E.isTexture!==!0&&(nr("WebGLRenderer: copyFramebufferToTexture function signature has changed."),B=arguments[0]||null,E=arguments[1]);const K=Math.pow(2,-q),H=Math.floor(E.image.width*K),pt=Math.floor(E.image.height*K),Tt=B!==null?B.x:0,Ct=B!==null?B.y:0;M.setTexture2D(E,0),v.copyTexSubImage2D(v.TEXTURE_2D,q,0,0,Tt,Ct,H,pt),W.unbindTexture()};const Sf=v.createFramebuffer(),Ef=v.createFramebuffer();this.copyTextureToTexture=function(E,B,q=null,K=null,H=0,pt=null){E.isTexture!==!0&&(nr("WebGLRenderer: copyTextureToTexture function signature has changed."),K=arguments[0]||null,E=arguments[1],B=arguments[2],pt=arguments[3]||0,q=null),pt===null&&(H!==0?(nr("WebGLRenderer: copyTextureToTexture function signature has changed to support src and dst mipmap levels."),pt=H,H=0):pt=0);let Tt,Ct,Pt,zt,Ht,Lt,$t,ne,xe;const me=E.isCompressedTexture?E.mipmaps[pt]:E.image;if(q!==null)Tt=q.max.x-q.min.x,Ct=q.max.y-q.min.y,Pt=q.isBox3?q.max.z-q.min.z:1,zt=q.min.x,Ht=q.min.y,Lt=q.isBox3?q.min.z:0;else{const nn=Math.pow(2,-H);Tt=Math.floor(me.width*nn),Ct=Math.floor(me.height*nn),E.isDataArrayTexture?Pt=me.depth:E.isData3DTexture?Pt=Math.floor(me.depth*nn):Pt=1,zt=0,Ht=0,Lt=0}K!==null?($t=K.x,ne=K.y,xe=K.z):($t=0,ne=0,xe=0);const Jt=Rt.convert(B.format),It=Rt.convert(B.type);let Re;B.isData3DTexture?(M.setTexture3D(B,0),Re=v.TEXTURE_3D):B.isDataArrayTexture||B.isCompressedArrayTexture?(M.setTexture2DArray(B,0),Re=v.TEXTURE_2D_ARRAY):(M.setTexture2D(B,0),Re=v.TEXTURE_2D),v.pixelStorei(v.UNPACK_FLIP_Y_WEBGL,B.flipY),v.pixelStorei(v.UNPACK_PREMULTIPLY_ALPHA_WEBGL,B.premultiplyAlpha),v.pixelStorei(v.UNPACK_ALIGNMENT,B.unpackAlignment);const ie=v.getParameter(v.UNPACK_ROW_LENGTH),un=v.getParameter(v.UNPACK_IMAGE_HEIGHT),Bi=v.getParameter(v.UNPACK_SKIP_PIXELS),qe=v.getParameter(v.UNPACK_SKIP_ROWS),br=v.getParameter(v.UNPACK_SKIP_IMAGES);v.pixelStorei(v.UNPACK_ROW_LENGTH,me.width),v.pixelStorei(v.UNPACK_IMAGE_HEIGHT,me.height),v.pixelStorei(v.UNPACK_SKIP_PIXELS,zt),v.pixelStorei(v.UNPACK_SKIP_ROWS,Ht),v.pixelStorei(v.UNPACK_SKIP_IMAGES,Lt);const fe=E.isDataArrayTexture||E.isData3DTexture,en=B.isDataArrayTexture||B.isData3DTexture;if(E.isDepthTexture){const nn=Q.get(E),Ne=Q.get(B),Ge=Q.get(nn.__renderTarget),Mo=Q.get(Ne.__renderTarget);W.bindFramebuffer(v.READ_FRAMEBUFFER,Ge.__webglFramebuffer),W.bindFramebuffer(v.DRAW_FRAMEBUFFER,Mo.__webglFramebuffer);for(let _i=0;_i<Pt;_i++)fe&&(v.framebufferTextureLayer(v.READ_FRAMEBUFFER,v.COLOR_ATTACHMENT0,Q.get(E).__webglTexture,H,Lt+_i),v.framebufferTextureLayer(v.DRAW_FRAMEBUFFER,v.COLOR_ATTACHMENT0,Q.get(B).__webglTexture,pt,xe+_i)),v.blitFramebuffer(zt,Ht,Tt,Ct,$t,ne,Tt,Ct,v.DEPTH_BUFFER_BIT,v.NEAREST);W.bindFramebuffer(v.READ_FRAMEBUFFER,null),W.bindFramebuffer(v.DRAW_FRAMEBUFFER,null)}else if(H!==0||E.isRenderTargetTexture||Q.has(E)){const nn=Q.get(E),Ne=Q.get(B);W.bindFramebuffer(v.READ_FRAMEBUFFER,Sf),W.bindFramebuffer(v.DRAW_FRAMEBUFFER,Ef);for(let Ge=0;Ge<Pt;Ge++)fe?v.framebufferTextureLayer(v.READ_FRAMEBUFFER,v.COLOR_ATTACHMENT0,nn.__webglTexture,H,Lt+Ge):v.framebufferTexture2D(v.READ_FRAMEBUFFER,v.COLOR_ATTACHMENT0,v.TEXTURE_2D,nn.__webglTexture,H),en?v.framebufferTextureLayer(v.DRAW_FRAMEBUFFER,v.COLOR_ATTACHMENT0,Ne.__webglTexture,pt,xe+Ge):v.framebufferTexture2D(v.DRAW_FRAMEBUFFER,v.COLOR_ATTACHMENT0,v.TEXTURE_2D,Ne.__webglTexture,pt),H!==0?v.blitFramebuffer(zt,Ht,Tt,Ct,$t,ne,Tt,Ct,v.COLOR_BUFFER_BIT,v.NEAREST):en?v.copyTexSubImage3D(Re,pt,$t,ne,xe+Ge,zt,Ht,Tt,Ct):v.copyTexSubImage2D(Re,pt,$t,ne,zt,Ht,Tt,Ct);W.bindFramebuffer(v.READ_FRAMEBUFFER,null),W.bindFramebuffer(v.DRAW_FRAMEBUFFER,null)}else en?E.isDataTexture||E.isData3DTexture?v.texSubImage3D(Re,pt,$t,ne,xe,Tt,Ct,Pt,Jt,It,me.data):B.isCompressedArrayTexture?v.compressedTexSubImage3D(Re,pt,$t,ne,xe,Tt,Ct,Pt,Jt,me.data):v.texSubImage3D(Re,pt,$t,ne,xe,Tt,Ct,Pt,Jt,It,me):E.isDataTexture?v.texSubImage2D(v.TEXTURE_2D,pt,$t,ne,Tt,Ct,Jt,It,me.data):E.isCompressedTexture?v.compressedTexSubImage2D(v.TEXTURE_2D,pt,$t,ne,me.width,me.height,Jt,me.data):v.texSubImage2D(v.TEXTURE_2D,pt,$t,ne,Tt,Ct,Jt,It,me);v.pixelStorei(v.UNPACK_ROW_LENGTH,ie),v.pixelStorei(v.UNPACK_IMAGE_HEIGHT,un),v.pixelStorei(v.UNPACK_SKIP_PIXELS,Bi),v.pixelStorei(v.UNPACK_SKIP_ROWS,qe),v.pixelStorei(v.UNPACK_SKIP_IMAGES,br),pt===0&&B.generateMipmaps&&v.generateMipmap(Re),W.unbindTexture()},this.copyTextureToTexture3D=function(E,B,q=null,K=null,H=0){return E.isTexture!==!0&&(nr("WebGLRenderer: copyTextureToTexture3D function signature has changed."),q=arguments[0]||null,K=arguments[1]||null,E=arguments[2],B=arguments[3],H=arguments[4]||0),nr('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(E,B,q,K,H)},this.initRenderTarget=function(E){Q.get(E).__webglFramebuffer===void 0&&M.setupRenderTarget(E)},this.initTexture=function(E){E.isCubeTexture?M.setTextureCube(E,0):E.isData3DTexture?M.setTexture3D(E,0):E.isDataArrayTexture||E.isCompressedArrayTexture?M.setTexture2DArray(E,0):M.setTexture2D(E,0),W.unbindTexture()},this.resetState=function(){F=0,L=0,V=null,W.reset(),Ot.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Gn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const e=this.getContext();e.drawingBufferColorspace=Qt._getDrawingBufferColorSpace(t),e.unpackColorSpace=Qt._getUnpackColorSpace()}}const Cu={type:"change"},Wl={type:"start"},df={type:"end"},Bs=new _o,Pu=new ri,SM=Math.cos(70*n_.DEG2RAD),ye=new k,ke=2*Math.PI,le={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},ha=1e-6;class EM extends O_{constructor(t,e=null){super(t,e),this.state=le.NONE,this.enabled=!0,this.target=new k,this.cursor=new k,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:lr.ROTATE,MIDDLE:lr.DOLLY,RIGHT:lr.PAN},this.touches={ONE:ir.ROTATE,TWO:ir.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._domElementKeyEvents=null,this._lastPosition=new k,this._lastQuaternion=new Ni,this._lastTargetPosition=new k,this._quat=new Ni().setFromUnitVectors(t.up,new k(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new iu,this._sphericalDelta=new iu,this._scale=1,this._panOffset=new k,this._rotateStart=new Yt,this._rotateEnd=new Yt,this._rotateDelta=new Yt,this._panStart=new Yt,this._panEnd=new Yt,this._panDelta=new Yt,this._dollyStart=new Yt,this._dollyEnd=new Yt,this._dollyDelta=new Yt,this._dollyDirection=new k,this._mouse=new Yt,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=TM.bind(this),this._onPointerDown=yM.bind(this),this._onPointerUp=bM.bind(this),this._onContextMenu=LM.bind(this),this._onMouseWheel=RM.bind(this),this._onKeyDown=CM.bind(this),this._onTouchStart=PM.bind(this),this._onTouchMove=DM.bind(this),this._onMouseDown=AM.bind(this),this._onMouseMove=wM.bind(this),this._interceptControlDown=IM.bind(this),this._interceptControlUp=UM.bind(this),this.domElement!==null&&this.connect(),this.update()}connect(){this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents(),this.domElement.getRootNode().removeEventListener("keydown",this._interceptControlDown,{capture:!0}),this.domElement.style.touchAction="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(t){t.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=t}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(Cu),this.update(),this.state=le.NONE}update(t=null){const e=this.object.position;ye.copy(e).sub(this.target),ye.applyQuaternion(this._quat),this._spherical.setFromVector3(ye),this.autoRotate&&this.state===le.NONE&&this._rotateLeft(this._getAutoRotationAngle(t)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let i=this.minAzimuthAngle,r=this.maxAzimuthAngle;isFinite(i)&&isFinite(r)&&(i<-Math.PI?i+=ke:i>Math.PI&&(i-=ke),r<-Math.PI?r+=ke:r>Math.PI&&(r-=ke),i<=r?this._spherical.theta=Math.max(i,Math.min(r,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(i+r)/2?Math.max(i,this._spherical.theta):Math.min(r,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let s=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{const o=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),s=o!=this._spherical.radius}if(ye.setFromSpherical(this._spherical),ye.applyQuaternion(this._quatInverse),e.copy(this.target).add(ye),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let o=null;if(this.object.isPerspectiveCamera){const a=ye.length();o=this._clampDistance(a*this._scale);const l=a-o;this.object.position.addScaledVector(this._dollyDirection,l),this.object.updateMatrixWorld(),s=!!l}else if(this.object.isOrthographicCamera){const a=new k(this._mouse.x,this._mouse.y,0);a.unproject(this.object);const l=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),s=l!==this.object.zoom;const c=new k(this._mouse.x,this._mouse.y,0);c.unproject(this.object),this.object.position.sub(c).add(a),this.object.updateMatrixWorld(),o=ye.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;o!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(o).add(this.object.position):(Bs.origin.copy(this.object.position),Bs.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(Bs.direction))<SM?this.object.lookAt(this.target):(Pu.setFromNormalAndCoplanarPoint(this.object.up,this.target),Bs.intersectPlane(Pu,this.target))))}else if(this.object.isOrthographicCamera){const o=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),o!==this.object.zoom&&(this.object.updateProjectionMatrix(),s=!0)}return this._scale=1,this._performCursorZoom=!1,s||this._lastPosition.distanceToSquared(this.object.position)>ha||8*(1-this._lastQuaternion.dot(this.object.quaternion))>ha||this._lastTargetPosition.distanceToSquared(this.target)>ha?(this.dispatchEvent(Cu),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(t){return t!==null?ke/60*this.autoRotateSpeed*t:ke/60/60*this.autoRotateSpeed}_getZoomScale(t){const e=Math.abs(t*.01);return Math.pow(.95,this.zoomSpeed*e)}_rotateLeft(t){this._sphericalDelta.theta-=t}_rotateUp(t){this._sphericalDelta.phi-=t}_panLeft(t,e){ye.setFromMatrixColumn(e,0),ye.multiplyScalar(-t),this._panOffset.add(ye)}_panUp(t,e){this.screenSpacePanning===!0?ye.setFromMatrixColumn(e,1):(ye.setFromMatrixColumn(e,0),ye.crossVectors(this.object.up,ye)),ye.multiplyScalar(t),this._panOffset.add(ye)}_pan(t,e){const i=this.domElement;if(this.object.isPerspectiveCamera){const r=this.object.position;ye.copy(r).sub(this.target);let s=ye.length();s*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*t*s/i.clientHeight,this.object.matrix),this._panUp(2*e*s/i.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(t*(this.object.right-this.object.left)/this.object.zoom/i.clientWidth,this.object.matrix),this._panUp(e*(this.object.top-this.object.bottom)/this.object.zoom/i.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(t,e){if(!this.zoomToCursor)return;this._performCursorZoom=!0;const i=this.domElement.getBoundingClientRect(),r=t-i.left,s=e-i.top,o=i.width,a=i.height;this._mouse.x=r/o*2-1,this._mouse.y=-(s/a)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(t){return Math.max(this.minDistance,Math.min(this.maxDistance,t))}_handleMouseDownRotate(t){this._rotateStart.set(t.clientX,t.clientY)}_handleMouseDownDolly(t){this._updateZoomParameters(t.clientX,t.clientX),this._dollyStart.set(t.clientX,t.clientY)}_handleMouseDownPan(t){this._panStart.set(t.clientX,t.clientY)}_handleMouseMoveRotate(t){this._rotateEnd.set(t.clientX,t.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const e=this.domElement;this._rotateLeft(ke*this._rotateDelta.x/e.clientHeight),this._rotateUp(ke*this._rotateDelta.y/e.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(t){this._dollyEnd.set(t.clientX,t.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(t){this._panEnd.set(t.clientX,t.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(t){this._updateZoomParameters(t.clientX,t.clientY),t.deltaY<0?this._dollyIn(this._getZoomScale(t.deltaY)):t.deltaY>0&&this._dollyOut(this._getZoomScale(t.deltaY)),this.update()}_handleKeyDown(t){let e=!1;switch(t.code){case this.keys.UP:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateUp(ke*this.rotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),e=!0;break;case this.keys.BOTTOM:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateUp(-ke*this.rotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),e=!0;break;case this.keys.LEFT:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateLeft(ke*this.rotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),e=!0;break;case this.keys.RIGHT:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateLeft(-ke*this.rotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),e=!0;break}e&&(t.preventDefault(),this.update())}_handleTouchStartRotate(t){if(this._pointers.length===1)this._rotateStart.set(t.pageX,t.pageY);else{const e=this._getSecondPointerPosition(t),i=.5*(t.pageX+e.x),r=.5*(t.pageY+e.y);this._rotateStart.set(i,r)}}_handleTouchStartPan(t){if(this._pointers.length===1)this._panStart.set(t.pageX,t.pageY);else{const e=this._getSecondPointerPosition(t),i=.5*(t.pageX+e.x),r=.5*(t.pageY+e.y);this._panStart.set(i,r)}}_handleTouchStartDolly(t){const e=this._getSecondPointerPosition(t),i=t.pageX-e.x,r=t.pageY-e.y,s=Math.sqrt(i*i+r*r);this._dollyStart.set(0,s)}_handleTouchStartDollyPan(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enablePan&&this._handleTouchStartPan(t)}_handleTouchStartDollyRotate(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enableRotate&&this._handleTouchStartRotate(t)}_handleTouchMoveRotate(t){if(this._pointers.length==1)this._rotateEnd.set(t.pageX,t.pageY);else{const i=this._getSecondPointerPosition(t),r=.5*(t.pageX+i.x),s=.5*(t.pageY+i.y);this._rotateEnd.set(r,s)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const e=this.domElement;this._rotateLeft(ke*this._rotateDelta.x/e.clientHeight),this._rotateUp(ke*this._rotateDelta.y/e.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(t){if(this._pointers.length===1)this._panEnd.set(t.pageX,t.pageY);else{const e=this._getSecondPointerPosition(t),i=.5*(t.pageX+e.x),r=.5*(t.pageY+e.y);this._panEnd.set(i,r)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(t){const e=this._getSecondPointerPosition(t),i=t.pageX-e.x,r=t.pageY-e.y,s=Math.sqrt(i*i+r*r);this._dollyEnd.set(0,s),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);const o=(t.pageX+e.x)*.5,a=(t.pageY+e.y)*.5;this._updateZoomParameters(o,a)}_handleTouchMoveDollyPan(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enablePan&&this._handleTouchMovePan(t)}_handleTouchMoveDollyRotate(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enableRotate&&this._handleTouchMoveRotate(t)}_addPointer(t){this._pointers.push(t.pointerId)}_removePointer(t){delete this._pointerPositions[t.pointerId];for(let e=0;e<this._pointers.length;e++)if(this._pointers[e]==t.pointerId){this._pointers.splice(e,1);return}}_isTrackingPointer(t){for(let e=0;e<this._pointers.length;e++)if(this._pointers[e]==t.pointerId)return!0;return!1}_trackPointer(t){let e=this._pointerPositions[t.pointerId];e===void 0&&(e=new Yt,this._pointerPositions[t.pointerId]=e),e.set(t.pageX,t.pageY)}_getSecondPointerPosition(t){const e=t.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[e]}_customWheelEvent(t){const e=t.deltaMode,i={clientX:t.clientX,clientY:t.clientY,deltaY:t.deltaY};switch(e){case 1:i.deltaY*=16;break;case 2:i.deltaY*=100;break}return t.ctrlKey&&!this._controlActive&&(i.deltaY*=10),i}}function yM(n){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(n.pointerId),this.domElement.addEventListener("pointermove",this._onPointerMove),this.domElement.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(n)&&(this._addPointer(n),n.pointerType==="touch"?this._onTouchStart(n):this._onMouseDown(n)))}function TM(n){this.enabled!==!1&&(n.pointerType==="touch"?this._onTouchMove(n):this._onMouseMove(n))}function bM(n){switch(this._removePointer(n),this._pointers.length){case 0:this.domElement.releasePointerCapture(n.pointerId),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(df),this.state=le.NONE;break;case 1:const t=this._pointers[0],e=this._pointerPositions[t];this._onTouchStart({pointerId:t,pageX:e.x,pageY:e.y});break}}function AM(n){let t;switch(n.button){case 0:t=this.mouseButtons.LEFT;break;case 1:t=this.mouseButtons.MIDDLE;break;case 2:t=this.mouseButtons.RIGHT;break;default:t=-1}switch(t){case lr.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(n),this.state=le.DOLLY;break;case lr.ROTATE:if(n.ctrlKey||n.metaKey||n.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(n),this.state=le.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(n),this.state=le.ROTATE}break;case lr.PAN:if(n.ctrlKey||n.metaKey||n.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(n),this.state=le.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(n),this.state=le.PAN}break;default:this.state=le.NONE}this.state!==le.NONE&&this.dispatchEvent(Wl)}function wM(n){switch(this.state){case le.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(n);break;case le.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(n);break;case le.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(n);break}}function RM(n){this.enabled===!1||this.enableZoom===!1||this.state!==le.NONE||(n.preventDefault(),this.dispatchEvent(Wl),this._handleMouseWheel(this._customWheelEvent(n)),this.dispatchEvent(df))}function CM(n){this.enabled!==!1&&this._handleKeyDown(n)}function PM(n){switch(this._trackPointer(n),this._pointers.length){case 1:switch(this.touches.ONE){case ir.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(n),this.state=le.TOUCH_ROTATE;break;case ir.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(n),this.state=le.TOUCH_PAN;break;default:this.state=le.NONE}break;case 2:switch(this.touches.TWO){case ir.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(n),this.state=le.TOUCH_DOLLY_PAN;break;case ir.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(n),this.state=le.TOUCH_DOLLY_ROTATE;break;default:this.state=le.NONE}break;default:this.state=le.NONE}this.state!==le.NONE&&this.dispatchEvent(Wl)}function DM(n){switch(this._trackPointer(n),this.state){case le.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(n),this.update();break;case le.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(n),this.update();break;case le.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(n),this.update();break;case le.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(n),this.update();break;default:this.state=le.NONE}}function LM(n){this.enabled!==!1&&n.preventDefault()}function IM(n){n.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function UM(n){n.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}var sn,he,_e,ai,ts,li,te,ul,pn,pf,hl,fl,dl,mf,pl;class NM extends Map{constructor(e={}){super();Kn(this,te);Kn(this,sn,0);Kn(this,he,new Map);Kn(this,_e,new Map);Kn(this,ai);Kn(this,ts);Kn(this,li);if(!(e.maxSize&&e.maxSize>0))throw new TypeError("`maxSize` must be a number greater than 0");if(typeof e.maxAge=="number"&&e.maxAge===0)throw new TypeError("`maxAge` must be a number greater than 0");Pe(this,ai,e.maxSize),Pe(this,ts,e.maxAge||Number.POSITIVE_INFINITY),Pe(this,li,e.onEviction)}get __oldCache(){return Nt(this,_e)}get(e){if(Nt(this,he).has(e)){const i=Nt(this,he).get(e);return de(this,te,hl).call(this,e,i)}if(Nt(this,_e).has(e)){const i=Nt(this,_e).get(e);if(de(this,te,pn).call(this,e,i)===!1)return de(this,te,mf).call(this,e,i),i.value}}set(e,i,{maxAge:r=Nt(this,ts)}={}){const s=typeof r=="number"&&r!==Number.POSITIVE_INFINITY?Date.now()+r:void 0;return Nt(this,he).has(e)?Nt(this,he).set(e,{value:i,expiry:s}):de(this,te,dl).call(this,e,{value:i,expiry:s}),this}has(e){return Nt(this,he).has(e)?!de(this,te,pn).call(this,e,Nt(this,he).get(e)):Nt(this,_e).has(e)?!de(this,te,pn).call(this,e,Nt(this,_e).get(e)):!1}peek(e){if(Nt(this,he).has(e))return de(this,te,fl).call(this,e,Nt(this,he));if(Nt(this,_e).has(e))return de(this,te,fl).call(this,e,Nt(this,_e))}delete(e){const i=Nt(this,he).delete(e);return i&&Eo(this,sn)._--,Nt(this,_e).delete(e)||i}clear(){Nt(this,he).clear(),Nt(this,_e).clear(),Pe(this,sn,0)}resize(e){if(!(e&&e>0))throw new TypeError("`maxSize` must be a number greater than 0");const i=[...de(this,te,pl).call(this)],r=i.length-e;r<0?(Pe(this,he,new Map(i)),Pe(this,_e,new Map),Pe(this,sn,i.length)):(r>0&&de(this,te,ul).call(this,i.slice(0,r)),Pe(this,_e,new Map(i.slice(r))),Pe(this,he,new Map),Pe(this,sn,0)),Pe(this,ai,e)}*keys(){for(const[e]of this)yield e}*values(){for(const[,e]of this)yield e}*[Symbol.iterator](){for(const e of Nt(this,he)){const[i,r]=e;de(this,te,pn).call(this,i,r)===!1&&(yield[i,r.value])}for(const e of Nt(this,_e)){const[i,r]=e;Nt(this,he).has(i)||de(this,te,pn).call(this,i,r)===!1&&(yield[i,r.value])}}*entriesDescending(){let e=[...Nt(this,he)];for(let i=e.length-1;i>=0;--i){const r=e[i],[s,o]=r;de(this,te,pn).call(this,s,o)===!1&&(yield[s,o.value])}e=[...Nt(this,_e)];for(let i=e.length-1;i>=0;--i){const r=e[i],[s,o]=r;Nt(this,he).has(s)||de(this,te,pn).call(this,s,o)===!1&&(yield[s,o.value])}}*entriesAscending(){for(const[e,i]of de(this,te,pl).call(this))yield[e,i.value]}get size(){if(!Nt(this,sn))return Nt(this,_e).size;let e=0;for(const i of Nt(this,_e).keys())Nt(this,he).has(i)||e++;return Math.min(Nt(this,sn)+e,Nt(this,ai))}get maxSize(){return Nt(this,ai)}entries(){return this.entriesAscending()}forEach(e,i=this){for(const[r,s]of this.entriesAscending())e.call(i,s,r,this)}get[Symbol.toStringTag](){return JSON.stringify([...this.entriesAscending()])}}sn=new WeakMap,he=new WeakMap,_e=new WeakMap,ai=new WeakMap,ts=new WeakMap,li=new WeakMap,te=new WeakSet,ul=function(e){if(typeof Nt(this,li)=="function")for(const[i,r]of e)Nt(this,li).call(this,i,r.value)},pn=function(e,i){return typeof i.expiry=="number"&&i.expiry<=Date.now()?(typeof Nt(this,li)=="function"&&Nt(this,li).call(this,e,i.value),this.delete(e)):!1},pf=function(e,i){if(de(this,te,pn).call(this,e,i)===!1)return i.value},hl=function(e,i){return i.expiry?de(this,te,pf).call(this,e,i):i.value},fl=function(e,i){const r=i.get(e);return de(this,te,hl).call(this,e,r)},dl=function(e,i){Nt(this,he).set(e,i),Eo(this,sn)._++,Nt(this,sn)>=Nt(this,ai)&&(Pe(this,sn,0),de(this,te,ul).call(this,Nt(this,_e)),Pe(this,_e,Nt(this,he)),Pe(this,he,new Map))},mf=function(e,i){Nt(this,_e).delete(e),de(this,te,dl).call(this,e,i)},pl=function*(){for(const e of Nt(this,_e)){const[i,r]=e;Nt(this,he).has(i)||de(this,te,pn).call(this,i,r)===!1&&(yield e)}for(const e of Nt(this,he)){const[i,r]=e;de(this,te,pn).call(this,i,r)===!1&&(yield e)}};const FM=[12,12,50,50,150,150,150,150,150,150,150,150],Xl=FM.map(n=>new NM({maxSize:n,onEviction:(t,e)=>{e&&e instanceof of&&(e.parent&&e.parent.remove(e),e.geometry&&e.geometry.dispose(),e.material&&(Array.isArray(e.material)?e.material.forEach(i=>i.dispose()):e.material.dispose()))}}));function OM(n,t,e){const i=Math.log2(n);Xl[i].set(t,e)}function BM(n,t){const e=Math.log2(n);return Xl[e].has(t)}function zM(n,t){const e=Math.log2(n);return Xl[e].get(t)||[]}var bt={},Du;function HM(){if(Du)return bt;Du=1,Object.defineProperty(bt,"__esModule",{value:!0}),bt.uniq2orderpix=bt.orderpix2uniq=bt.fxy2tu=bt.bit_decombine=bt.bit_combine=bt.fxy2nest=bt.vec2ang=bt.ang2vec=bt.tu2za=bt.za2tu=bt.tu2fxy=bt.pixcoord2vec_ring=bt.pixcoord2vec_nest=bt.nside2resol=bt.nside2pixarea=bt.corners_ring=bt.corners_nest=bt.max_pixrad=bt.query_disc_inclusive_ring=bt.query_disc_inclusive_nest=bt.pix2ang_ring=bt.pix2vec_ring=bt.pix2ang_nest=bt.pix2vec_nest=bt.ring2fxy=bt.ring2nest=bt.nest2ring=bt.ang2pix_ring=bt.ang2pix_nest=bt.vec2pix_ring=bt.vec2pix_nest=bt.nside2npix=bt.nside2order=bt.order2nside=void 0;function n(m){return 1<<m}bt.order2nside=n;function t(m){return ct(m)}bt.nside2order=t;function e(m){return 12*m*m}bt.nside2npix=e;function i(m,y){var A=At(y[0],y[1],y[2]),I=A.z,z=A.a;return at(m,I,z)}bt.vec2pix_nest=i;function r(m,y){var A=At(y[0],y[1],y[2]),I=A.z,z=A.a;return a(m,at(m,I,z))}bt.vec2pix_ring=r;function s(m,y,A){var I=Math.cos(y);return at(m,I,A)}bt.ang2pix_nest=s;function o(m,y,A){var I=Math.cos(y);return a(m,at(m,I,A))}bt.ang2pix_ring=o;function a(m,y){var A=v(m,y),I=A.f,z=A.x,Y=A.y;return $(m,I,z,Y)}bt.nest2ring=a;function l(m,y){if(m==1)return y;var A=c(m,y),I=A.f,z=A.x,Y=A.y;return Zt(m,I,z,Y)}bt.ring2nest=l;function c(m,y){var A=2*m*(m-1);if(y<A){var I=Math.floor((Math.sqrt(1+2*y)+1)/2),z=y-2*I*(I-1),Y=Math.floor(z/I),ht=z%I,X=m-I+ht,lt=m-1-ht;return{f:Y,x:X,y:lt}}if(y<A+8*m*m){var ht=y-A,ut=4*m,I=m-Math.floor(ht/ut),Et=I%2==0?1:0,z=2*(ht%ut)+Et,dt=z-4*m,wt=I+5*m-1,Rt=(wt+dt)/2,Ot=(wt-dt)/2,N=Math.floor(Rt/m),_t=Math.floor(Ot/m),j=5-(N+_t),st=N-_t+4,Y=4*j+(st>>1)%4,X=Rt%m,lt=Ot%m;return{f:Y,x:X,y:lt}}else{var Mt=12*m*m-y-1,I=Math.floor((Math.sqrt(1+2*Mt)+1)/2),z=Mt-2*I*(I-1),Y=11-Math.floor(z/I),ht=z%I,X=I-ht-1,lt=ht;return{f:Y,x:X,y:lt}}}bt.ring2fxy=c;function u(m,y){var A=v(m,y),I=A.f,z=A.x,Y=A.y,ht=tt(m,I,z,Y),X=ht.t,lt=ht.u,ut=ft(X,lt),Et=ut.z,dt=ut.a;return gt(Et,dt)}bt.pix2vec_nest=u;function h(m,y){var A=v(m,y),I=A.f,z=A.x,Y=A.y,ht=tt(m,I,z,Y),X=ht.t,lt=ht.u,ut=ft(X,lt),Et=ut.z,dt=ut.a;return{theta:Math.acos(Et),phi:dt}}bt.pix2ang_nest=h;function d(m,y){return u(m,l(m,y))}bt.pix2vec_ring=d;function p(m,y){return h(m,l(m,y))}bt.pix2ang_ring=p;function x(m,y,A,I){if(A>St)throw new Error("query_disc: radius must < PI/2");var z=g(m),Y=xt/m,ht=At(y[0],y[1],y[2]),X=ht.z,lt=ht.a,ut=Math.sqrt(1-X*X),Et=Math.cos(A),dt=Math.sin(A),wt=X*Et+ut*dt,Rt=X*Et-ut*dt,Ot=it(wt,0).u,N=it(Rt,0).u,_t=ut*Et-X*dt<0,j=ut*Et+X*dt<0,st=Math.floor((St-Ot)/Y),Mt=Math.floor((St-N)/Y+1);if(_t){++st;for(var vt=1;vt<=st;++vt)F(m,vt,I);++st}if(st==0&&(F(m,1,I),st=2),j){--Mt;for(var vt=Mt;vt<=4*m-1;++vt)F(m,vt,I);--Mt}Mt==4*m&&(F(m,4*m-1,I),Mt=4*m-2);for(var Vt=Math.acos(X),vt=st;vt<=Mt;++vt)b(m,vt,lt,Vt,A+z,function(Ee){f(u(m,Ee),y)<=A+z&&I(Ee)})}bt.query_disc_inclusive_nest=x;function S(m,y,A,I){return x(m,y,A,function(z){I(a(m,z))})}bt.query_disc_inclusive_ring=S;function g(m){var y=xt/m;return f(P(y,m*y),P(y,(m+1)*y))}bt.max_pixrad=g;function f(m,y){return 2*Math.asin(Math.sqrt(C(m,y))/2)}function P(m,y){var A=ft(m,y),I=A.z,z=A.a;return gt(I,z)}function C(m,y){var A=m[0]-y[0],I=m[1]-y[1],z=m[2]-y[2];return A*A+I*I+z*z}function b(m,y,A,I,z,Y){if(I<z||I+z>mt)return F(m,y,Y);var ht=xt*(2-y/m),X=ft(xt,ht).z,lt=Math.sin(I),ut=Math.cos(I),Et=Math.sin(z),dt=Math.cos(z),wt=Math.atan2(Math.sqrt(-M(X-ut*dt)/(M(lt)*Et*Et)+1)*Et,(-X*ut+dt)/lt);if(wt>=mt)return F(m,y,Y);for(var Rt=O(m,y,it(X,nt(A-wt,G)).t),Ot=O(m,y,it(X,nt(A+wt,G)).t),N=et(m,Rt,ht),_t=V(m,et(m,Ot,ht)),j=N;!L(j,_t);j=V(m,j))Y(Zt(m,j.f,j.x,j.y))}function O(m,y,A){var I=xt/m;return A/=I,A=(A+y%2>>1<<1)+1-y%2,A*=I,A}function F(m,y,A){var I=xt*(2-y/m),z=xt*(1+(1-y%2)/m),Y=et(m,z,I),ht=Y;do A(Zt(m,ht.f,ht.x,ht.y)),ht=V(m,ht);while(!L(ht,Y))}function L(m,y){return m.x==y.x&&m.y==y.y&&m.f==y.f}function V(m,y){var A=y.f,I=y.x,z=y.y;if(++I,I==m)switch(Math.floor(A/4)){case 0:A=(A+1)%4,I=z,z=m;break;case 1:A=A-4,I=0;break;case 2:A=4+(A+1)%4,I=0;break}if(--z,z==-1)switch(Math.floor(A/4)){case 0:A=4+(A+1)%4,z=m-1;break;case 1:A=A+4,z=m-1;break;case 2:{A=8+(A+1)%4,z=I-1,I=0;break}}return{f:A,x:I,y:z}}function w(m,y){for(var A=v(m,y),I=A.f,z=A.x,Y=A.y,ht=tt(m,I,z,Y),X=ht.t,lt=ht.u,ut=xt/m,Et=[],dt=0,wt=[[0,ut],[-ut,0],[0,-ut],[ut,0]];dt<wt.length;dt++){var Rt=wt[dt],Ot=Rt[0],N=Rt[1],_t=ft(X+Ot,lt+N),j=_t.z,st=_t.a;Et.push(gt(j,st))}return Et}bt.corners_nest=w;function T(m,y){return w(m,l(m,y))}bt.corners_ring=T;function U(m){return mt/(3*m*m)}bt.nside2pixarea=U;function rt(m){return Math.sqrt(mt/3)/m}bt.nside2resol=rt;function Z(m,y,A,I){var z=v(m,y),Y=z.f,ht=z.x,X=z.y,lt=tt(m,Y,ht,X),ut=lt.t,Et=lt.u,dt=xt/m,wt=ft(ut+dt*(A-I),Et+dt*(A+I-1)),Rt=wt.z,Ot=wt.a;return gt(Rt,Ot)}bt.pixcoord2vec_nest=Z;function ot(m,y,A,I){return Z(m,l(m,y),A,I)}bt.pixcoord2vec_ring=ot;function at(m,y,A){var I=it(y,A),z=I.t,Y=I.u,ht=et(m,z,Y),X=ht.f,lt=ht.x,ut=ht.y;return Zt(m,X,lt,ut)}function et(m,y,A){var I=Bt(y,A),z=I.f,Y=I.p,ht=I.q,X=_(Math.floor(m*Y),0,m-1),lt=_(Math.floor(m*ht),0,m-1);return{f:z,x:X,y:lt}}bt.tu2fxy=et;function nt(m,y){return m<0?y- -m%y:m%y}var G=2*Math.PI,mt=Math.PI,St=Math.PI/2,xt=Math.PI/4,Ut=Math.PI/8;function Kt(m){return m<0?-Kt(-m):2-Math.sqrt(3*(1-m))}function it(m,y){if(Math.abs(m)<=2/3){var A=y,I=3*Ut*m;return{t:A,u:I}}else{var z=y%St,Y=Kt(m),A=y-(Math.abs(Y)-1)*(z-xt),I=xt*Y;return{t:A,u:I}}}bt.za2tu=it;function ft(m,y){var A=Math.abs(y);if(A>=St)return{z:Q(y),a:0};if(A<=Math.PI/4){var I=8/(3*mt)*y,z=m;return{z:I,a:z}}else{var Y=m%(Math.PI/2),z=m-(A-xt)/(A-St)*(Y-xt),I=Q(y)*(1-1/3*M(2-4*A/mt));return{z:I,a:z}}}bt.tu2za=ft;function At(m,y,A){var I=m*m+y*y;if(I==0)return{z:A<0?-1:1,a:0};var z=(Math.atan2(y,m)+G)%G;return A/=Math.sqrt(A*A+I),{z:A,a:z}}function gt(m,y){var A=Math.sqrt(1-m*m),I=A*Math.cos(y),z=A*Math.sin(y);return[I,z,m]}function Dt(m,y){var A=Math.cos(m);return gt(A,y)}bt.ang2vec=Dt;function Ft(m){var y=At(m[0],m[1],m[2]),A=y.z,I=y.a;return{theta:Math.acos(A),phi:I}}bt.vec2ang=Ft;function Bt(m,y){m/=xt,y/=xt,m=nt(m,8),m+=-4,y+=5;var A=_((y+m)/2,0,5),I=Math.floor(A),z=_((y-m)/2,3-I,6-I),Y=Math.floor(z),ht=5-(I+Y);if(ht<0)return{f:0,p:1,q:1};var X=I-Y+4,lt=4*ht+(X>>1)%4,ut=A%1,Et=z%1;return{f:lt,p:ut,q:Et}}function Zt(m,y,A,I){return y*m*m+qt(A,I)}bt.fxy2nest=Zt;function qt(m,y){return D(m<65536),D(y<32768),m&1|(m&2|y&1)<<1|(m&4|y&2)<<2|(m&8|y&4)<<3|(m&16|y&8)<<4|(m&32|y&16)<<5|(m&64|y&32)<<6|(m&128|y&64)<<7|(m&256|y&128)<<8|(m&512|y&256)<<9|(m&1024|y&512)<<10|(m&2048|y&1024)<<11|(m&4096|y&2048)<<12|(m&8192|y&4096)<<13|(m&16384|y&8192)<<14|(m&32768|y&16384)<<15|y&32768<<16}bt.bit_combine=qt;function R(m){D(m<=2147483647);var y=(m&1)>>0|(m&4)>>1|(m&16)>>2|(m&64)>>3|(m&256)>>4|(m&1024)>>5|(m&4096)>>6|(m&16384)>>7|(m&65536)>>8|(m&262144)>>9|(m&1048576)>>10|(m&4194304)>>11|(m&16777216)>>12|(m&67108864)>>13|(m&268435456)>>14|(m&1073741824)>>15,A=(m&2)>>1|(m&8)>>2|(m&32)>>3|(m&128)>>4|(m&512)>>5|(m&2048)>>6|(m&8192)>>7|(m&32768)>>8|(m&131072)>>9|(m&524288)>>10|(m&2097152)>>11|(m&8388608)>>12|(m&33554432)>>13|(m&134217728)>>14|(m&536870912)>>15;return{x:y,y:A}}bt.bit_decombine=R;function v(m,y){var A=m*m,I=Math.floor(y/A),z=y%A,Y=R(z),ht=Y.x,X=Y.y;return{f:I,x:ht,y:X}}function $(m,y,A,I){var z=Math.floor(y/4),Y=z+2,ht=A+I,X=Y*m-ht-1;if(X<m){var lt=y%4,ut=2*X*(X-1)+X*lt+m-I-1;return ut}if(X<3*m){var Et=A-I,dt=2*(y%4)-z%2+1,wt=(dt*m+Et+8*m)%(8*m),Rt=2*m*(m-1),ut=Rt+(X-m)*4*m+(wt>>1);return ut}else{var Ot=4*m-X,N=3-y%4,_t=4*Ot-Ot*N-I,j=4*Ot-_t+1,ut=12*m*m-2*Ot*(Ot-1)-j;return ut}}function tt(m,y,A,I){var z=Math.floor(y/4),Y=z+2,ht=2*(y%4)-z%2+1,X=A+I,lt=A-I,ut=Y*m-X-1,Et=ht*m+lt+8*m,dt=Et/m*xt,wt=St-ut/m*xt;return{t:dt,u:wt}}bt.fxy2tu=tt;function J(m,y){return 4*((1<<2*m)-1)+y}bt.orderpix2uniq=J;function W(m){D(m<=2147483647);for(var y=0,A=(m>>2)+1;A>=4;)A>>=2,++y;var I=m-((1<<2*y)-1<<2);return{order:y,ipix:I}}bt.uniq2orderpix=W;function ct(m){for(var y=-1;m>0;)m>>=1,++y;return y}var Q=Math.sign||function(m){return m>0?1:m<0?-1:0};function M(m){return m*m}function _(m,y,A){return m<y?y:m>A?A:m}function D(m){if(console.assert(m),!m)debugger}return bt}var Lu=HM();function VM(n,t){const e=-Math.cos(t)*Math.sin(n),i=Math.sin(t),r=-Math.cos(t)*Math.cos(n);return[e,i,r]}function _f(n,t,e){const i=Math.sqrt(n*n+t*t+e*e);n/=i,t/=i,e/=i;const r=Math.asin(t);return[Math.atan2(n,e)+Math.PI,r]}function GM(n,t){return[t+Math.PI/2,n]}function kM(n,t){const e=t;let i=e/180*Math.PI/4;i>Math.PI/2&&(i=Math.PI/2);const[r,s]=_f(...n),[o,a]=GM(r,s),l=[120,70,60,30,15,10,7,6,4,3,0,0],c=new Set;for(let u=0;u<12;u++)c.add([1,u]);for(let u=2;Math.log2(u)<=10&&!(e>l[Math.log2(u)]);u*=2){const h=new Set;Lu.query_disc_inclusive_nest(u,Lu.ang2vec(o,a),i,d=>{h.add(d)});for(let d of h)c.add([u,d])}return c}function WM(n){const t=n.length,e=new Float32Array(t*3),i=new Float32Array(t),r=10;return n.forEach((s,o)=>{const a=parseFloat(s.ra)*(Math.PI/180),l=parseFloat(s.de)*(Math.PI/180),c=parseFloat(s.vmag),[u,h,d]=VM(a,l);e[o*3]=r*u,e[o*3+1]=r*h,e[o*3+2]=r*d,i[o]=c}),{positions:e,vmags:i}}const XM=()=>new Yn({uniforms:{color:{value:new ee(16777215)},fov:{value:120}},vertexShader:`
      attribute float vmag;
      uniform float fov; 
      varying float vAlpha;
      
      float vmag2size(float vmag) {
        float a = 7.76;
        float b = 0.3;
        float c = 0.0;
        float d;
        if (fov < 17.0) {
            d = 0.2 * exp(-(0.2 * fov -4.0)) + 2.9;
            //d = -0.7 * fov + 9.33;
        } else {
            d = 4.0 * (1.0 - fov/120.0);
        }
        return min(25.0, a * exp(-b * (vmag - d)) + c);
      }
          
      void main() {
        vAlpha = 1.0;
        float scale = 1.0;
        float size = vmag2size(vmag);
        if (size < 1.5) { //TODO make fov dependence
            gl_PointSize = 0.0;
            return;
        }
        if (size < 4.0) {
            vAlpha = 0.4 * size - 0.6;
        }
        gl_PointSize = size / scale;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      uniform vec3 color;
      varying float vAlpha;
      void main() {
        vec2 coord = gl_PointCoord - vec2(0.5); // Центрирование координат в [0, 0]
        float dist = length(coord); // Расстояние от центра
        if (dist > 0.5) {
          discard; // Удаляем пиксели за пределами диска
        }
        float alpha = 1.0 - smoothstep(0.4, 0.5, dist); // Плавный переход к краям диска
        gl_FragColor = vec4(color, alpha * vAlpha);
      }
    `,transparent:!0}),gf=(n,t)=>{const e=n.__vccOpts||n;for(const[i,r]of t)e[i]=r;return e},qM={name:"StarScene",data(){return{camera:null,controls:null,visible_healpixels:null,scene:null,isLoading:!1}},mounted(){this.initThree()},methods:{async fetchStarsHeal(n,t){const i=`/api/stars/get?${new URLSearchParams({nside:n,pix:t}).toString()}`,r=await fetch(i);if(!r.ok)throw new Error("Failed to fetch");return await r.json()},async updateStars(){if(!this.isLoading){this.isLoading=!0;try{const n=new k;this.camera.getWorldDirection(n),this.visible_healpixels=kM(n.toArray(),this.camera.fov);const t=[];for(const[e,i]of this.visible_healpixels)if(!BM(e,i)){const r=(async()=>{const s=await this.fetchStarsHeal(e,i),{positions:o,vmags:a}=WM(s),l=new tn;l.setAttribute("position",new Je(o,3)),l.setAttribute("vmag",new Je(a,1));const c=new of(l,this.starMaterial);OM(e,i,c),this.scene.add(zM(e,i))})();t.push(r)}await Promise.all(t)}catch(n){console.error(n)}finally{this.isLoading=!1}}},async initThree(){const n=new C_;this.scene=n,this.camera=new an(75,window.innerWidth/window.innerHeight,.1,1e3),this.camera.position.set(0,0,.01),this.camera.up.set(0,1,0),this.camera.fov=120;const t=new MM({antialias:!0});t.setPixelRatio(window.devicePixelRatio),t.setSize(window.innerWidth,window.innerHeight),this.$refs.threeContainer.appendChild(t.domElement),this.controls=new EM(this.camera,t.domElement),this.controls.rotateSpeed=-1,this.controls.enableZoom=!1,this.controls.enableDamping=!0,this.controls.dampingFactor=.2,this.controls.minDistance=7,this.controls.maxDistance=7,this.camera.updateProjectionMatrix(),this.visible_healpixels=new Set;const e=1e3;this.starMaterial=XM(),setInterval(this.updateStars.bind(this),e);const i=10,r=256,s=24,o=9,a=new sf({color:16777215,transparent:!0,opacity:.3});this.addEquator(n,i,r,a),this.addMeridians(n,i,r,s,a),this.addParallels(n,i,r,o,a),window.addEventListener("wheel",async u=>{const h=[120,60,30,15,5,1],d=this.camera.fov;if(this.controls.rotateSpeed=-1*this.camera.fov/200,this.camera.fov+=u.deltaY*.05*(this.camera.fov/60),this.camera.fov=Math.max(.01,Math.min(120,this.camera.fov)),this.starMaterial.uniforms.fov.value=this.camera.fov,this.camera.fov<=60)this.controls.minDistance=.1,this.controls.maxDistance=.1;else{const p=.11666666666666667*this.camera.fov-7;this.controls.minDistance=p,this.controls.maxDistance=p}this.camera.updateProjectionMatrix();for(let p=0;p<h.length;p++)d<h[p]&&h[p]<=this.camera.fov&&await this.updateStars(),this.camera.fov<h[p]&&h[p]<=d&&await this.updateStars()});const l=()=>{let u=new k;this.camera.getWorldDirection(u),u=u.toArray();const h=_f(...u).map(d=>(d*180/Math.PI).toFixed(2));return"fov: "+this.camera.fov.toFixed(3).toString()+`
polar: `+this.controls.getPolarAngle().toFixed(2)+" azimuthal: "+this.controls.getAzimuthalAngle().toFixed(2)+`
cartesian dir: `+u.map(d=>d.toFixed(2)).join(", ")+`
ra: `+h[0]+" de: "+h[1]+`
`+(this.isLoading?"Loading stars...":"")},c=()=>{document.getElementById("fovValue").textContent=l(),this.controls.update(),t.render(n,this.camera)};t.setAnimationLoop(c),window.addEventListener("resize",()=>{this.camera.aspect=window.innerWidth/window.innerHeight,this.camera.updateProjectionMatrix(),t.setSize(window.innerWidth,window.innerHeight)})},addEquator(n,t,e,i){const r=new tn,s=[];for(let a=0;a<=e;a++){const l=a/e*Math.PI*2;s.push(t*Math.cos(l),0,t*Math.sin(l))}r.setAttribute("position",new Je(s,3));const o=new ia(r,i);n.add(o)},addMeridians(n,t,e,i,r){for(let s=0;s<i;s++){const o=s/i*Math.PI*2,a=new tn,l=[];for(let u=0;u<=e;u++){const h=u/e*Math.PI;l.push(t*Math.sin(h)*Math.cos(o),t*Math.cos(h),t*Math.sin(h)*Math.sin(o))}a.setAttribute("position",new Je(l,3));const c=new ia(a,r);n.add(c)}},addParallels(n,t,e,i,r){for(let s=1;s<=i;s++){const o=s/(i+1)*Math.PI,a=new tn,l=[];for(let u=0;u<=e;u++){const h=u/e*Math.PI*2;l.push(t*Math.sin(o)*Math.cos(h),t*Math.cos(o),t*Math.sin(o)*Math.sin(h))}a.setAttribute("position",new Je(l,3));const c=new ia(a,r);n.add(c)}}}},YM={id:"app"},jM={ref:"threeContainer",class:"three-container"};function KM(n,t,e,i,r,s){return bh(),Ah("div",YM,[kr("div",jM,null,512),t[0]||(t[0]=kr("div",{id:"hud"},[kr("pre",{id:"fovValue"},"75")],-1))])}const $M=gf(qM,[["render",KM]]),ZM={name:"App",components:{ThreeScene:$M}},JM={id:"app"};function QM(n,t,e,i,r,s){const o=Ld("ThreeScene");return bh(),Ah("div",JM,[ci(o)])}const tS=gf(ZM,[["render",QM]]);Kp(tS).mount("#app");
