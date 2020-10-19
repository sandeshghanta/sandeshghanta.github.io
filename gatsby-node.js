const { graphqlForRuntimeLog } = require("./src/scripts/createRuntimeLog");

function createIndividualPages(actions, graphql) {
  const { createPage } = actions;

  return Promise.all([
    graphqlForRuntimeLog(graphql, createPage)
  ])
}

exports.createPages = ({ graphql, actions }) => {
  return createIndividualPages(actions, graphql);
}
