import { actions, model } from 'data'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import BtcLinkHandling from './template'
import React from 'react'

const { ENABLE_BTC_LINKS } = model.analytics.PREFERENCE_EVENTS.GENERAL
class BtcLinkHandlingContainer extends React.PureComponent {
  state = { warningDisplayed: false }

  handleClick = () => {
    this.setState({ warningDisplayed: !this.state.warningDisplayed })
    // Register bitcoin links
    window.navigator.registerProtocolHandler(
      'bitcoin',
      '/#/open/%s',
      'Blockchain'
    )
    this.props.analyticsActions.logEvent(ENABLE_BTC_LINKS)
  }

  render () {
    return (
      <BtcLinkHandling
        warningDisplayed={this.state.warningDisplayed}
        handleClick={this.handleClick}
      />
    )
  }
}

const mapDispatchToProps = dispatch => ({
  analyticsActions: bindActionCreators(actions.analytics, dispatch)
})

export default connect(
  null,
  mapDispatchToProps
)(BtcLinkHandlingContainer)
