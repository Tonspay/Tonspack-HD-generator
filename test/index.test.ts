import { HDWallet } from "../src";

//init
test("🍺 Init the wallet with self-generate", () => {
  console.log(
     new HDWallet()
  )
})

test("🍺 Init wallet with password & path", () => {
  console.log(
     new HDWallet(
      {
        pwd:"1234",
        path:16
      }
     )
  )
})

test("🍺 Recover wallets from keypair ", () => {
  console.log(
    HDWallet.fromPrivateKey(
      {
        sk:"2dnv6i5vLQFRFFQKpyVhxvijQHE7orgReQJVJ12PboKw",
      }
    )
  ) //EQDpIyH1vMsRDA8jjswasfuNhKxk7ocjRgNm5TLNHVfJfqgv
})

test("🍺 Recover wallets from password and path ", () => {
  console.log(
    HDWallet.fromPrivateKey(
      {
        sk:"2Lte2V623NW7pafsAbpzGTQQ8y6Kbnzwop39RyybkPFessboN92d2pUfZi4Xi8KkFccqmC1zyRZ6wfRY2EKgqDu6",
        pwd:"1234",
        path:16
      }
    )
  ) //EQD0JHElkzWfelbEy4fAK-YmjWcyhCkFkF5rwFHBkZXVp5QP
})