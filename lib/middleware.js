'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createMiddleware;

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

// Current latest version of GraphiQL
const GRAPHIQL_VERSION = '0.7.3';

function createMiddleware(getOptions) {
  return (() => {
    var _ref = _asyncToGenerator(function* () {
      const options = getDefaultOptions(this);
      let overrides = {};
      if (typeof getOptions === 'function') {
        overrides = getOptions(this);
      } else if (typeof getOptions === 'object') {
        overrides = getOptions;
      }
      Object.assign(options, typeof overrides.then === 'function' ? yield overrides : overrides);

      this.body = renderHtml(options);
      this.type = 'text/html';
    });

    function middleware() {
      return _ref.apply(this, arguments);
    }

    return middleware;
  })();
}

function getDefaultOptions(ctx) {
  const body = ctx.request.body || {};
  const query = body.query || ctx.query.query;

  let variables;
  let variablesString = body.variables || ctx.query.variables;
  try {
    variables = JSON.parse(variablesString);
  } catch (e) {}

  let result;
  let resultString = body.result || ctx.query.result;
  try {
    result = JSON.parse(resultString);
  } catch (e) {}

  const css = `//cdn.jsdelivr.net/graphiql/${GRAPHIQL_VERSION}/graphiql.css`;
  const js = `//cdn.jsdelivr.net/graphiql/${GRAPHIQL_VERSION}/graphiql.min.js`;
  const url = '/graphql';

  return { query, variables, result, css, js, url };
}

/**
 * See express-graphql for the original implementation
 */
function renderHtml(options) {
  const queryString = options.query;
  const variablesString = options.variables ? JSON.stringify(options.variables, null, 2) : null;
  const resultString = options.result ? JSON.stringify(options.result, null, 2) : null;

  // How to Meet Ladies
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>GraphiQL</title>
  <meta name="robots" content="noindex" />
  <style>
    html, body {
      height: 100%;
      margin: 0;
      overflow: hidden;
      width: 100%;
    }
    #content {
      height: 100%
    }
  </style>
  <link href="${options.css}" rel="stylesheet" />
  <link href="${options.theme}.css" rel="stylesheet" />
  <script src="fetch.min.js"></script>
  <script src="react.js"></script>
  <script src="react-dom.js"></script>
  <script src="${options.js}"></script>
</head>
<body>
  <div id="content"></div>
  <script>
    // Collect the URL parameters
    var parameters = {}
    window.location.search.substr(1).split('&').forEach(function (entry) {
      var eq = entry.indexOf('=')
      if (eq >= 0) {
        parameters[decodeURIComponent(entry.slice(0, eq))] =
          decodeURIComponent(entry.slice(eq + 1))
      }
    })
    // Produce a Location query string from a parameter object.
    function locationQuery(params) {
      return '?' + Object.keys(params).map(function (key) {
        return encodeURIComponent(key) + '=' +
          encodeURIComponent(params[key])
      }).join('&')
    }
    // Derive a fetch URL from the current URL, sans the GraphQL parameters.
    var graphqlParamNames = {
      query: true,
      variables: true,
      operationName: true
    }
    var otherParams = {}
    for (var k in parameters) {
      if (parameters.hasOwnProperty(k) && graphqlParamNames[k] !== true) {
        otherParams[k] = parameters[k]
      }
    }
    var fetchURL = ${JSON.stringify(options.url)} + locationQuery(otherParams)
    // Defines a GraphQL fetcher using the fetch API.
    function graphQLFetcher(graphQLParams) {
      let headers = {}
      return fetch(fetchURL, {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(graphQLParams),
        credentials: 'include',
      }).then(function(response) {
        for (let header of response.headers.entries()) {
          headers[header[0]] = decodeURIComponent(header[1])
        }
        return response.text()
      }).then(function(respText) {
        try {
          const body = JSON.parse(respText)
          Object.defineProperty(body, '_headers', {
            value: headers,
            enumberable: false
          })
          return body
        } catch (e) {
          return respText
        }
      })
    }
    // When the query and variables string is edited, update the URL bar so
    // that it can be easily shared.
    function onEditQuery(newQuery) {
      parameters.query = newQuery
      updateURL()
    }
    function onEditVariables(newVariables) {
      parameters.variables = newVariables
      updateURL()
    }
    function updateURL() {
      history.replaceState(null, null, locationQuery(parameters))
    }
    // Render <GraphiQL /> into the body.
    ReactDOM.render(
      React.createElement(GraphiQL, {
        fetcher: graphQLFetcher,
        onEditQuery: onEditQuery,
        onEditVariables: onEditVariables,
        query: ${JSON.stringify(queryString)},
        response: ${JSON.stringify(resultString)},
        variables: ${JSON.stringify(variablesString)},
        theme: ${options.theme}
      }),
      document.getElementById('content')
    )
  </script>
</body>
</html>`;
}