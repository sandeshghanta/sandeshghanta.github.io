(window.webpackJsonp=window.webpackJsonp||[]).push([[7],{"7WCv":function(e,t,a){"use strict";a.r(t),a.d(t,"pageQuery",(function(){return m}));var n=a("KQm4"),r=a("q1tI"),o=a.n(r),l=a("Wbzz"),i=a("Bl7J"),c=a("vrFN");a("5jen");t.default=function(e){var t=e.data,a=Object(r.useState)("all"),m=a[0],u=a[1];Object(r.useEffect)((function(){var e=new URLSearchParams(window.location.search).get("tag");u(e||"all")}));var s="runtimeLogs";"all"!==m&&(s=s+" with tag: "+m);var d=t.allMarkdownRemark.edges.filter((function(e){return"all"===m||-1!==e.node.frontmatter.tags.indexOf(m)?1:void 0})),f=new Set;return t.allMarkdownRemark.edges.forEach((function(e,t){e.node.frontmatter.tags.forEach((function(e){f.add(e)}))})),f=Object(n.a)(f.keys()),o.a.createElement(i.a,null,o.a.createElement(c.a,{title:"Home"}),o.a.createElement("h4",null,"Note"),"If you feel any of the information here is either wrong||outdated||can be improved, please inform me by sending a PR or raising a issue at ",o.a.createElement("a",{href:"https://github.com/sandeshghanta/gatsby-theme-console"},"Github"),o.a.createElement("h4",null,"Tags"),f.map((function(e){return o.a.createElement(l.Link,{to:"/runtimeLog?tag="+e},o.a.createElement("span",{className:"badge badge-dark"},e))})),o.a.createElement("h4",null,s),o.a.createElement("ul",null,d.map((function(e){return o.a.createElement("li",{className:"p-1"},o.a.createElement(l.Link,{to:"/runtimeLog/"+e.node.frontmatter.slug},"[",e.node.frontmatter.modified_date,"]: ",e.node.frontmatter.title),"    ",e.node.frontmatter.tags.map((function(e){return o.a.createElement(l.Link,{to:"/runtimeLog?tag="+e},o.a.createElement("span",{className:"badge badge-dark"},e))})))}))))};var m="4234726379"}}]);
//# sourceMappingURL=component---src-pages-runtime-log-js-0f241d3df6ddd7bcb6f9.js.map