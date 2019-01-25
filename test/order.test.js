import 'chai/register-should'

import nock, { mockOrder } from './server'

import { order } from '../src'

describe('order function', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  it('should return order status', async () => {
    mockOrder()
    
    const response = await order({
      accessToken: '',
      order: {}
    })

    response.should.have.property('redirectUri')
    response.should.have.property('status')
    response.should.have.property('orderId')
  })
})
