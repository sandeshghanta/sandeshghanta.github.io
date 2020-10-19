import React from "react"
import Layout from "../components/layout"
import { graphql, Link } from "gatsby"
import SEO from "../components/seo"


export default function runtimeLogTemplate({ data: { markdownRemark } }) {
  function generateHTML() {
    return {__html: markdownRemark.html};
  }
  return(
    <Layout>
      <SEO title={markdownRemark.frontmatter.title} />
      <div className="content">
        <h2 className="p-2">{markdownRemark.frontmatter.title}</h2>
        Author: {markdownRemark.frontmatter.author}<br></br>
        Created: {markdownRemark.frontmatter.created_date}
        ,&nbsp;&nbsp;&nbsp;&nbsp; LastModified: {markdownRemark.frontmatter.modified_date}
        <hr></hr> 
        <div dangerouslySetInnerHTML={generateHTML()} />
      </div>
    </Layout>
  )
}
export const pageQuery = graphql`
    query PostQuery($slug: String!) {
        markdownRemark(frontmatter: { slug: { eq: $slug } }) {
            frontmatter{
                author
                slug
                title
                created_date
                modified_date
            }
            html
        }
    }
`
