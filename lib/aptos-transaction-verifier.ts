import { aptos } from './aptos-client'

interface VerifyResult {
  verified: boolean
  reason?: string
}

// Verify an Aptos vote transaction: sender, receiver, amount
export async function verifyVoteTransaction(
  txHash: string,
  voterWallet: string,
  platformWallet: string,
  expectedAmount: number
): Promise<VerifyResult> {
  try {
    const tx = await aptos.getTransactionByHash({ transactionHash: txHash })

    if (!('success' in tx) || !tx.success) {
      return { verified: false, reason: 'Transaction failed on-chain' }
    }

    if (!('sender' in tx) || tx.sender !== voterWallet) {
      return { verified: false, reason: 'Sender mismatch' }
    }

    // Check events for coin transfer to platform wallet
    if ('events' in tx && Array.isArray(tx.events)) {
      const transferEvent = tx.events.find(
        (e: { type: string; data?: { amount?: string; to?: string } }) =>
          e.type.includes('CoinDeposit') || e.type.includes('DepositEvent') || e.type.includes('coin::deposit')
      )
      if (transferEvent?.data) {
        // Verify amount (coin amounts are in smallest unit)
        const amount = Number(transferEvent.data.amount)
        if (amount < expectedAmount) {
          return { verified: false, reason: 'Insufficient amount' }
        }
      }
    }

    return { verified: true }
  } catch (err) {
    console.error('Tx verification error:', err)
    return { verified: false, reason: 'Failed to fetch transaction' }
  }
}
