const path = require("path")

function createRuntimeLogPages(result, createPage) {
  const runtimeLogTemplate = path.resolve(`src/templates/runtimeLogTemplate.js`)
  const blogs = result.data.allMarkdownRemark.edges
  blogs.forEach(({ node }) => {
    createPage({
      path: "/runtimeLog" + "/" + node.frontmatter.slug,
      component: runtimeLogTemplate,
      context: {
        slug: node.frontmatter.slug
      },
    })
  })
}

function graphqlForRuntimeLog(graphql, createPage) {
  return graphql(`
    {
        allMarkdownRemark(filter: { frontmatter: { draft: { ne: true } } }){
            edges{
                node{
                    frontmatter{
                        title
                        author
                        created_date
                        modified_date
                        slug
                    }
                    html
                }
            }
        }
    }
  `).then(result => {
    if (result.errors) {
      throw result.errors
    }
    createRuntimeLogPages(result, createPage)
  })
}

exports.graphqlForRuntimeLog = graphqlForRuntimeLog
