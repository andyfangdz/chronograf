import React, {ReactElement, Component} from 'react'
import PropTypes from 'prop-types'
import {withRouter, InjectedRouter} from 'react-router'
import {Location} from 'history'
import {connect} from 'react-redux'
import {bindActionCreators} from 'redux'

import {
  isUserAuthorized,
  VIEWER_ROLE,
  EDITOR_ROLE,
  ADMIN_ROLE,
} from 'src/auth/Authorized'

import {getSourceHealth} from 'src/sources/apis'
import {getSourcesAsync} from 'src/shared/actions/sources'

import {errorThrown as errorThrownAction} from 'src/shared/actions/errors'
import {notify as notifyAction} from 'src/shared/actions/notifications'

import {DEFAULT_HOME_PAGE} from 'src/shared/constants'

import * as copy from 'src/shared/copy/notifications'

import {Source, Me} from 'src/types'

interface Auth {
  isUsingAuth: boolean
  me: Me
}

interface State {
  isFetching: boolean
}

interface Params {
  sourceID: string
}

interface Props {
  getSources: () => void
  sources: Source[]
  children: ReactElement<any>
  params: Params
  router: InjectedRouter
  location: Location
  auth: Auth
  notify: () => void
  errorThrown: () => void
}

// Acts as a 'router middleware'. The main `App` component is responsible for
// getting the list of data sources, but not every page requires them to function.
// Routes that do require data sources can be nested under this component.
export class CheckSources extends Component<Props, State> {
  public static childContextTypes = {
    source: PropTypes.shape({
      links: PropTypes.shape({
        proxy: PropTypes.string.isRequired,
        self: PropTypes.string.isRequired,
        kapacitors: PropTypes.string.isRequired,
        queries: PropTypes.string.isRequired,
        permissions: PropTypes.string.isRequired,
        users: PropTypes.string.isRequired,
        databases: PropTypes.string.isRequired,
      }).isRequired,
    }),
  }

  constructor(props) {
    super(props)

    this.state = {
      isFetching: true,
    }
  }

  public getChildContext() {
    const {sources, params} = this.props
    return {source: sources.find(s => s.id === params.sourceID)}
  }

  public async componentWillMount() {
    const {
      router,
      auth: {isUsingAuth, me},
    } = this.props
    if (!isUsingAuth || isUserAuthorized(me.role, VIEWER_ROLE)) {
      await this.props.getSources()
      this.setState({isFetching: false})
    } else {
      router.push('/purgatory')
      return
    }
  }

  public shouldComponentUpdate(nextProps) {
    const {location} = nextProps

    if (
      !this.state.isFetching &&
      this.props.location.pathname === location.pathname
    ) {
      return false
    }

    return true
  }

  public async componentWillUpdate(nextProps, nextState) {
    const {
      router,
      location,
      params,
      errorThrown,
      sources,
      auth: {
        isUsingAuth,
        me,
        me: {organizations = [], currentOrganization},
      },
      notify,
    } = nextProps
    const {isFetching} = nextState
    const source = sources.find(s => s.id === params.sourceID)
    const defaultSource = sources.find(s => s.default === true)

    if (
      isUserAuthorized(this.props.auth.me.role, ADMIN_ROLE) &&
      !isUserAuthorized(nextProps.auth.me.role, ADMIN_ROLE)
    ) {
      return router.push('/')
    }

    if (!isFetching && isUsingAuth && !organizations.length) {
      notify(copy.notifyUserRemovedFromAllOrgs())
      return router.push('/purgatory')
    }

    if (
      me.superAdmin &&
      !organizations.find(o => o.id === currentOrganization.id)
    ) {
      notify(copy.notifyUserRemovedFromCurrentOrg())
      return router.push('/purgatory')
    }

    if (!isFetching && isUsingAuth && !isUserAuthorized(me.role, VIEWER_ROLE)) {
      // if you're a member, go to purgatory.
      return router.push('/purgatory')
    }

    // TODO: At this point, the sources we have in Redux may be out of sync with what's on the server
    // Do we need to refresh this data more frequently? Does it need to come as frequently as the `me` response?
    if (!isFetching && !source) {
      const rest = location.pathname.match(/\/sources\/\d+?\/(.+)/)
      const restString = rest === null ? DEFAULT_HOME_PAGE : rest[1]

      if (isUsingAuth && !isUserAuthorized(me.role, EDITOR_ROLE)) {
        if (defaultSource) {
          return router.push(`/sources/${defaultSource.id}/${restString}`)
        } else if (sources[0]) {
          return router.push(`/sources/${sources[0].id}/${restString}`)
        }
        // if you're a viewer and there are no sources, go to purgatory.
        notify(copy.notifyOrgHasNoSources())
        return router.push('/purgatory')
      }

      // if you're an editor or not using auth, try for sources or otherwise
      // create one
      if (defaultSource) {
        return router.push(`/sources/${defaultSource.id}/${restString}`)
      } else if (sources[0]) {
        return router.push(`/sources/${sources[0].id}/${restString}`)
      }

      return router.push(`/sources/new?redirectPath=${location.pathname}`)
    }

    if (!isFetching && !location.pathname.includes('/manage-sources')) {
      try {
        await getSourceHealth(source.links.health)
      } catch (error) {
        errorThrown(error, copy.notifySourceNoLongerAvailable(source.name))
      }
    }
  }

  public render() {
    const {
      params,
      sources,
      auth: {
        isUsingAuth,
        me: {currentOrganization},
      },
    } = this.props
    const {isFetching} = this.state
    const source = sources.find(s => s.id === params.sourceID)

    if (isFetching || !source || (isUsingAuth && !currentOrganization)) {
      return <div className="page-spinner" />
    }

    // TODO: guard against invalid resource access

    return (
      this.props.children &&
      React.cloneElement(this.props.children, {...this.props, source})
    )
  }
}

const mapStateToProps = ({sources, auth}) => ({
  sources,
  auth,
})

const mapDispatchToProps = dispatch => ({
  getSources: bindActionCreators(getSourcesAsync, dispatch),
  errorThrown: bindActionCreators(errorThrownAction, dispatch),
  notify: bindActionCreators(notifyAction, dispatch),
})

export default connect(mapStateToProps, mapDispatchToProps)(
  withRouter(CheckSources)
)
