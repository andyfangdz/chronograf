import React, {PureComponent} from 'react'
import DataExplorer from './DataExplorer'

import {Source} from 'src/types'

interface Props {
  source: Source
}

class DataExplorerPage extends PureComponent<Props> {
  public render() {
    return (
      <div className="page">
        <DataExplorer source={this.props.source} />
      </div>
    )
  }
}

export default DataExplorerPage
