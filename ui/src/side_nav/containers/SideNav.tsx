import React, {PureComponent} from 'react'
import {withRouter, Link} from 'react-router'
import {connect} from 'react-redux'

import Authorized, {ADMIN_ROLE} from 'src/auth/Authorized'

import UserNavBlock from 'src/side_nav/components/UserNavBlock'
import FeatureFlag from 'src/shared/components/FeatureFlag'

import {
  NavBlock,
  NavHeader,
  NavListItem,
} from 'src/side_nav/components/NavItems'

import {DEFAULT_HOME_PAGE} from 'src/shared/constants'
import {Params, Location, Links, Me} from 'src/types/sideNav'

interface Props {
  params: Params
  location: Location
  isHidden: boolean
  isUsingAuth?: boolean
  logoutLink?: string
  links?: Links
  me: Me
}

class SideNav extends PureComponent<Props> {
  constructor(props) {
    super(props)
  }

  public render() {
    const {
      params: {sourceID},
      location: {pathname: location},
      isHidden,
      isUsingAuth,
      logoutLink,
      links,
      me,
    } = this.props

    const sourcePrefix = `/sources/${sourceID}`
    const dataExplorerLink = `${sourcePrefix}/chronograf/data-explorer`

    const isDefaultPage = location.split('/').includes(DEFAULT_HOME_PAGE)

    return isHidden ? null : (
      <nav className="sidebar">
        <div
          className={isDefaultPage ? 'sidebar--item active' : 'sidebar--item'}
        >
          <Link
            to={`${sourcePrefix}/${DEFAULT_HOME_PAGE}`}
            className="sidebar--square sidebar--logo"
          >
            <span className="sidebar--icon icon cubo-uniform" />
          </Link>
        </div>
        <NavBlock
          icon="cubo-node"
          link={`${sourcePrefix}/hosts`}
          location={location}
        >
          <NavHeader link={`${sourcePrefix}/hosts`} title="Host List" />
        </NavBlock>
        <NavBlock icon="graphline" link={dataExplorerLink} location={location}>
          <NavHeader link={dataExplorerLink} title="Data Explorer" />
        </NavBlock>
        <NavBlock
          icon="dash-h"
          link={`${sourcePrefix}/dashboards`}
          location={location}
        >
          <NavHeader link={`${sourcePrefix}/dashboards`} title="Dashboards" />
        </NavBlock>
        <NavBlock
          matcher="alerts"
          icon="alert-triangle"
          link={`${sourcePrefix}/alert-rules`}
          location={location}
        >
          <NavHeader link={`${sourcePrefix}/alert-rules`} title="Alerting" />
          <NavListItem link={`${sourcePrefix}/alert-rules`}>
            Manage Tasks
          </NavListItem>
          <NavListItem link={`${sourcePrefix}/alerts`}>
            Alert History
          </NavListItem>
        </NavBlock>

        <Authorized
          requiredRole={ADMIN_ROLE}
          replaceWithIfNotUsingAuth={
            <NavBlock
              icon="crown2"
              link={`${sourcePrefix}/admin-influxdb`}
              location={location}
            >
              <NavHeader
                link={`${sourcePrefix}/admin-influxdb`}
                title="InfluxDB Admin"
              />
            </NavBlock>
          }
        >
          <NavBlock
            icon="crown2"
            link={`${sourcePrefix}/admin-chronograf`}
            location={location}
          >
            <NavHeader
              link={`${sourcePrefix}/admin-chronograf`}
              title="Admin"
            />
            <NavListItem link={`${sourcePrefix}/admin-chronograf`}>
              Chronograf
            </NavListItem>
            <NavListItem link={`${sourcePrefix}/admin-influxdb`}>
              InfluxDB
            </NavListItem>
          </NavBlock>
        </Authorized>
        <NavBlock
          icon="cog-thick"
          link={`${sourcePrefix}/manage-sources`}
          location={location}
        >
          <NavHeader
            link={`${sourcePrefix}/manage-sources`}
            title="Configuration"
          />
        </NavBlock>
        {isUsingAuth ? (
          <UserNavBlock
            logoutLink={logoutLink}
            links={links}
            me={me}
            sourcePrefix={sourcePrefix}
          />
        ) : null}
        <FeatureFlag name="time-machine">
          <NavBlock
            icon="cog-thick"
            link={`${sourcePrefix}/delorean`}
            location={location}
          >
            <NavHeader link={`${sourcePrefix}/delorean`} title="Time Machine" />
          </NavBlock>
        </FeatureFlag>
      </nav>
    )
  }
}

const mapStateToProps = ({
  auth: {isUsingAuth, logoutLink, me},
  app: {ephemeral: {inPresentationMode}},
  links,
}) => ({
  isHidden: inPresentationMode,
  isUsingAuth,
  logoutLink,
  links,
  me,
})

export default connect(mapStateToProps)(withRouter(SideNav))
