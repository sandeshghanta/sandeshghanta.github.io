import React from "react"
import { graphql, Link } from "gatsby"
import Layout from "../components/layout"
import SEO from "../components/seo"
import '../styles/style.sass'

export default class IndexPage extends React.Component{
  render() {
    return(
      <Layout>
        <SEO title="Home" />
        <h4>Introduction</h4>
        Hi, this is Sandesh Ghanta, the purpose of this website is to serve as a portfolio for myself and as a place for me to document my learnings (which I call runtimeLog) so that
        I and hopefully others can refer to them in the future.
        <h4>About Me</h4>
        I currently work as an SDE1 at Amazon in the compression-efficiency team of prime video. Some of the areas which I wish to learn more about are distributed systems, compilers and operating systems.
        <h4>Links</h4>
        <p>Competetive Programming: <a href="https://www.codechef.com/users/sandeshghanta">Codechef</a>, <a href="https://codeforces.com/profile/sandeshghanta">Codeforces</a></p>
        <p>Github: <a href="https://github.com/sandeshghanta">Github</a></p>
        <p>Social: <a href="https://www.linkedin.com/in/sandeshghanta/">Linkedin</a>, <a href="https://www.instagram.com/sandeshghanta/">Instagram</a>, <a href="https://www.facebook.com/sandesh.ghanta/">Facebook</a></p>
        <p>Email: sghanta05@gmail.com</p>
        <h4>Latest Update</h4>
        <div className="list">
          <ul>
            {this.props.data.allMarkdownRemark.edges.slice(0, 1).map(edge => (
              <li className="p-1" key={edge.node.frontmatter.slug}>
                <Link to={`/runtimeLog/` + edge.node.frontmatter.slug}>
                  [{edge.node.frontmatter.modified_date}]: {edge.node.frontmatter.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Layout>
    )
  }
}
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
