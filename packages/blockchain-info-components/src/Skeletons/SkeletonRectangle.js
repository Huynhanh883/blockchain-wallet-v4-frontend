import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

const Wrapper = styled.div`
  border-radius: 3px;
  width: ${props => props.width};
  height: ${props => props.height};
  background-color: ${props => props.theme[props.bgColor]};
`

const SkeletonRectangle = props => (
  <Wrapper {...props}>{props.children}</Wrapper>
)

SkeletonRectangle.defaultProps = {
  bgColor: 'gray-1'
}

SkeletonRectangle.propTypes = {
  width: PropTypes.string.isRequired,
  height: PropTypes.string.isRequired,
  bgColor: PropTypes.string.isRequired
}

export default SkeletonRectangle
