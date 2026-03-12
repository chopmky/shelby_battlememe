// Shelby blob URL helper
const SHELBY_API_URL = process.env.NEXT_PUBLIC_SHELBY_API_URL || 'https://api.shelbynet.shelby.xyz'

export const getBlobUrl = (owner: string, blobName: string) =>
  `${SHELBY_API_URL}/shelby/v1/blobs/${owner}/${blobName}`

// Query wallet blobs via Aptos Indexer GraphQL
export async function fetchWalletBlobs(ownerAddress: string) {
  const res = await fetch(`${SHELBY_API_URL}/v1/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
        query GetBlobs($owner: String!) {
          current_objects(
            where: { owner_address: { _eq: $owner } }
          ) {
            object_address
            owner_address
          }
        }
      `,
      variables: { owner: ownerAddress },
    }),
  })
  const data = await res.json()
  return data?.data?.current_objects ?? []
}
