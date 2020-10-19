import { Link } from "gatsby"
import PropTypes from "prop-types"
import React from "react"

const Header = () => {
  return (
    <header>
      <div className="menu">
        <ul>
          <Link to="/" style={{float: 'left'}}>
            <li>/home</li>
          </Link>
          <Link to="/runtimeLog">
            <li>/runtimeLog</li>
          </Link>
        </ul>
      </div>
    </header>
  )
}

Header.propTypes = {
  siteTitle: PropTypes.string,
}

Header.defaultProps = {
  siteTitle: ``,
}

export default Header
