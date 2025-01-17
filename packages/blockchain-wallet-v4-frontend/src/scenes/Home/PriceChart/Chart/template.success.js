import { calculateInterval, calculateStart } from 'services/ChartService'
import { getConfig, renderMinMax } from './services'
import PropTypes from 'prop-types'
import React from 'react'
import ReactHighcharts from 'react-highcharts'
import styled from 'styled-components'

const Wrapper = styled.div`
  position: absolute;
  bottom: ${({ isSilverOrAbove }) => (isSilverOrAbove ? '110px' : 0)};
  left: 0;
  width: 100%;
  * {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
      Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif !important;
  }
  svg {
    .highcharts-background {
      fill: ${props => props.theme['white']} !important;
    }
    -webkit-mask-image: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 1),
      rgba(0, 0, 0, 0)
    );
    -webkit-mask-size: 100% 125%;
    -webkit-mask-repeat: no-repeat;
  }
  .highcharts-tooltip span {
    padding: 0px 2px 2px 2px;
    > span:first-child {
      font-weight: 400;
    }
  }
  .highcharts-container,
  .highcharts-root {
    overflow: visible !important;
  }
  .min-max {
    opacity: 1;
    padding: 4px 6px;
    border-radius: 4px;
    color: ${props => props.theme['white']};
    background: ${props => props.theme[props.coin.toLowerCase()]};
    transition: opacity 0.3s;
  }
  &:hover {
    .min-max {
      opacity: 0;
      transition: opacity 0.3s 0.3s;
    }
  }
`

class Chart extends React.PureComponent {
  constructor (props) {
    super(props)
    const { coin, time, data, currency } = this.props
    const decimals = coin === 'XLM' ? 4 : 2
    const start = calculateStart(coin, time)
    const interval = calculateInterval(coin, time)
    const config = getConfig(start, interval, coin, currency, data, decimals)
    this.state = { config, start, interval, decimals }
  }

  handleCallback = chart => {
    const { currency, data } = this.props
    const { decimals } = this.state

    renderMinMax(chart, { currency, data, decimals })
  }

  render () {
    return (
      <Wrapper
        coin={this.props.coin}
        isSilverOrAbove={this.props.isSilverOrAbove}
      >
        <ReactHighcharts
          config={this.state.config}
          callback={this.handleCallback}
          isPureConfig
        />
      </Wrapper>
    )
  }
}

Chart.propTypes = {
  currency: PropTypes.string.isRequired,
  coin: PropTypes.string.isRequired,
  time: PropTypes.string.isRequired,
  data: PropTypes.array.isRequired
}

export default Chart
