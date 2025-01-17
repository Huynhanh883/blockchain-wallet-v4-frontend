import Content from './Content'
import React from 'react'
import styled from 'styled-components'

const Wrapper = styled.div`
  width: 100%;
`

const SfoxCheckoutContainer = props => {
  const { type, options, value } = props

  return (
    <Wrapper>
      <Content type={type} options={options} value={value} />
    </Wrapper>
  )
}

export default SfoxCheckoutContainer
