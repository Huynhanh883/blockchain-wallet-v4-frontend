import { Button, HeartbeatLoader, Link, Text } from 'blockchain-info-components'
import { CaptchaBox, Form, FormGroup } from 'components/Form'
import { Field, reduxForm } from 'redux-form'
import { FormattedMessage } from 'react-intl'
import { required } from 'services/FormHelper'
import { Wrapper } from 'components/Public'
import React from 'react'
import styled from 'styled-components'

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`
const SecondStepForm = styled(Form)`
  margin-top: 10px;
`
const CaptchaText = styled(Text)`
  margin: 6px 0 4px 0;
`
const WaitingText = styled(Text)`
  margin-top: 5px;
`
const BackLink = styled(Link)`
  margin-right: 15px;
`
const Footer = styled(FormGroup)`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  margin-top: 6px;
`

const SecondStep = props => {
  const { busy, previousStep, handleSubmit, invalid } = props

  return (
    <Wrapper>
      <Header>
        <Text size='20px' color='brand-primary' weight={600} capitalize>
          <FormattedMessage
            id='scenes.reset2fa.secondstep.reset2fa'
            defaultMessage='Reset 2FA'
          />
        </Text>
      </Header>
      <SecondStepForm onSubmit={handleSubmit}>
        <CaptchaText size='14px' weight={500}>
          <FormattedMessage
            id='scenes.reset2fa.secondstep.captcha'
            defaultMessage='Captcha'
          />
        </CaptchaText>
        <Field
          name='code'
          autoFocus
          validate={[required]}
          component={CaptchaBox}
        />
        <WaitingText size='12px' weight={400}>
          <FormattedMessage
            id='scenes.reset2fa.secondstep.waitingperiod'
            defaultMessage='Please note that reset requests are fully automated and require a mandatory waiting period before being approved.'
          />
        </WaitingText>
        <Footer>
          <BackLink onClick={previousStep} size='13px' weight={400}>
            <FormattedMessage
              id='scenes.reset2fa.secondstep.back'
              defaultMessage='Go Back'
            />
          </BackLink>
          <Button type='submit' nature='primary' disabled={busy || invalid}>
            {busy ? (
              <HeartbeatLoader height='20px' width='20px' color='white' />
            ) : (
              <FormattedMessage
                id='scenes.reset2fa.secondstep.reset'
                defaultMessage='Submit Request'
              />
            )}
          </Button>
        </Footer>
      </SecondStepForm>
    </Wrapper>
  )
}

export default reduxForm({ form: 'reset2FA', destroyOnUnmount: false })(
  SecondStep
)
