import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import React from 'react'

import { getData } from './selectors'
import Converter from './Converter'
import Error from './template.error'
import Loading from './template.loading'

class FiatConverterContainer extends React.PureComponent {
  render () {
    const { input, meta, data, disabled, errorBottom, className } = this.props

    return data.cata({
      Success: value => (
        <Converter
          {...value}
          className={className}
          meta={meta}
          errorBottom={errorBottom}
          value={input.value}
          onChange={input.onChange}
          onBlur={input.onBlur}
          onFocus={input.onFocus}
          disabled={disabled}
          data-e2e={this.props['data-e2e']}
        />
      ),
      Failure: message => <Error>{message}</Error>,
      Loading: () => <Loading />,
      NotAsked: () => <Loading />
    })
  }
}

FiatConverterContainer.propTypes = {
  input: PropTypes.shape({
    onBlur: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    onFocus: PropTypes.func.isRequired,
    value: PropTypes.oneOfType([
      PropTypes.string.isRequired,
      PropTypes.number.isRequired
    ])
  }).isRequired,
  coin: PropTypes.string.isRequired
}

const mapStateToProps = (state, ownProps) => ({
  data: getData(state, ownProps)
})

export default connect(mapStateToProps)(FiatConverterContainer)
