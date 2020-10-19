import React, { useEffect, useState } from "react"
import { graphql, Link } from "gatsby"
import Layout from "../components/layout"
import SEO from "../components/seo"
import '../styles/style.sass'

const IndexPage = ({data}) => {
  const [display, setDisplay] = useState('all');

  useEffect(() => {
    const urlParam = new URLSearchParams(window.location.search).get('tag');
    if(urlParam){
      setDisplay(urlParam);
    }
    else setDisplay('all');
  })
  let runtimeLogsHeading = "runtimeLogs";
  if (display !== "all"){
    runtimeLogsHeading = runtimeLogsHeading + " with tag: " + display;
  }
  const filter = data.allMarkdownRemark.edges.filter(edge => {
    if(display !== 'all'){
      if(edge.node.frontmatter.tags.indexOf(display) !== -1) return 1
    }else {
      return 1
    }
  })

  let uniqueTags = new Set();

  data.allMarkdownRemark.edges.forEach((item, i) => {
    item.node.frontmatter.tags.forEach((item1) => {
        uniqueTags.add(item1);
    })
  });
  uniqueTags = [...uniqueTags.keys()]

  return(
    <Layout>
      <SEO title="Home" />
      <h4>Note</h4>
      If you feel any of the information here is either wrong||outdated||can be improved, please inform me by sending a PR or raising a issue at <a href="https://github.com/sandeshghanta/gatsby-theme-console">Github</a>
      <h4>Tags</h4>
        {uniqueTags.map((tag) => (
          <Link to={`/runtimeLog?tag=` + tag}>
            <span className="badge badge-dark">{tag}</span>
          </Link>
        ))}
      <h4>{runtimeLogsHeading}</h4>
      <ul>
        {filter.map(edge => (
          <li className="p-1">
            <Link to={`/runtimeLog/` + edge.node.frontmatter.slug}>
              [{edge.node.frontmatter.modified_date}]: {edge.node.frontmatter.title}
            </Link>&nbsp;&nbsp;&nbsp;&nbsp;
            {edge.node.frontmatter.tags.map(tag => (
              <Link to={`/runtimeLog?tag=` + tag}>
                <span className="badge badge-dark">{tag}</span>
              </Link>
            ))}
          </li>
        ))}
      </ul>
    </Layout>
  )
}
export default IndexPage;
export const pageQuery = graphql`
    {
        allMarkdownRemark(sort: { fields: [frontmatter___modified_date], order: DESC }
            filter: { frontmatter: { draft: { ne: true } } }){
            edges{
                node{
                    frontmatter{
                        title
                        created_date
                        modified_date
                        slug
                        tags
                    }
                    html
                }
            }
        }
    }
`
