import { actions, model } from 'data'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { formValueSelector } from 'redux-form'
import { fromCashAddr } from 'blockchain-wallet-v4/src/utils/bch'
import { getData } from './selectors'
import { Remote } from 'blockchain-wallet-v4/src'
import BchImportedAddresses from './template'
import React from 'react'

const { WALLET_TX_SEARCH } = model.form

class ImportedAddressesContainer extends React.Component {
  shouldComponentUpdate (nextProps) {
    return !Remote.Loading.is(nextProps.data)
  }

  handleTransferAll = () => {
    this.props.actions.showModal(model.components.sendBch.MODAL, {
      from: 'allImportedAddresses',
      excludeHDWallets: true
    })
  }

  handleEditLabel = address => {
    const btcAddr = fromCashAddr(address.addr)
    this.props.componentActions.editLegacyAddressLabel(btcAddr)
  }
  render () {
    const { data, ...rest } = this.props
    return data.cata({
      Success: addresses => {
        return addresses.length ? (
          <BchImportedAddresses
            importedAddresses={addresses}
            onTransferAll={this.handleTransferAll}
            onEditLabel={this.handleEditLabel}
            {...rest}
          />
        ) : (
          <div />
        )
      },
      Failure: message => <div>{message}</div>,
      Loading: () => <div />,
      NotAsked: () => <div />
    })
  }
}

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators(actions.modals, dispatch),
  modalActions: bindActionCreators(actions.modals, dispatch),
  componentActions: bindActionCreators(
    actions.components.manageAddresses,
    dispatch
  )
})

const mapStateToProps = state => ({
  data: getData(state),
  search: formValueSelector(WALLET_TX_SEARCH)(state, 'search')
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ImportedAddressesContainer)
