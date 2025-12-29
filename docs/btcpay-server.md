<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# does btcpay server also support lightning network? What service dependencies does it have?

Yes, BTCPay Server supports the Lightning Network, and Lightning is a first‑class but optional feature. [^1_1][^1_2]

## Lightning support

- BTCPay can use an **internal** Lightning node (deployed alongside it) or connect to an **external** Lightning node you already run. [^1_3][^1_4]
- Supported implementations include LND, Core Lightning (CLN), and Eclair, and it can also integrate via REST with external stacks like Umbrel. [^1_1][^1_5]
- Lightning can be configured per store under Store → Settings → Lightning, where you choose internal or custom node via a connection string. [^1_3][^1_4]


## Core service dependencies

At the architectural level BTCPay depends on several backend services. [^1_6]

- **Bitcoin full node**: Typically Bitcoin Core, used for on‑chain validation and as the data source for NBXplorer. Required for mainnet Bitcoin support. [^1_6][^1_7]
- **NBXplorer**: A lightweight block explorer service that tracks transactions and addresses for BTCPay. [^1_6]
- **Database**:
    - Default: SQLite (file‑based, built in). [^1_8]
    - Recommended for production: PostgreSQL (or MySQL as an alternative) for more robust storage. [^1_8][^1_6]


## Additional dependencies for Lightning

Running Lightning through BTCPay adds more moving parts. [^1_6][^1_7]

- **Lightning implementation**:
    - LND, Core Lightning (CLN), or Eclair as the actual Lightning node backend. [^1_1][^1_9]
    - Optional management UI like Ride The Lightning (RTL) can be enabled from BTCPay “Services”. [^1_3]
- **Network ports**:
    - Lightning gossip/channels: port 9735 (Bitcoin Lightning; 9736 for Litecoin Lightning) needs to be reachable if you want public channels. [^1_6][^1_10]
- **Optional plugins/services**:
    - Breez plugin for LSP‑style hosted channels and simplified Lightning usage. [^1_11][^1_12]


## Deployment stack (typical setup)

Most production deployments use a Docker‑based bundle that pulls all required services. [^1_6][^1_13][^1_14]

- Docker and Docker Compose to orchestrate BTCPay, NBXplorer, Bitcoin Core, the database, and chosen Lightning node. [^1_6]
- Environment variables (BTCPAYGEN\_CRYPTO1, BTCPAYGEN\_LIGHTNING, BTCPAYGEN\_REVERSEPROXY, etc.) control which chains, Lightning implementation, and reverse proxy are provisioned. [^1_6][^1_10]

If you share how you plan to deploy it (e.g., Dokploy, k8s, bare‑metal Docker), a concrete dependency/service map can be sketched for that environment.
<span style="display:none">[^1_15][^1_16][^1_17][^1_18][^1_19][^1_20]</span>

<div align="center">⁂</div>

[^1_1]: https://docs.btcpayserver.org/Guide/

[^1_2]: https://wiki.archlinux.org/title/Btcpayserver

[^1_3]: https://docs.btcpayserver.org/LightningNetwork/

[^1_4]: https://docs.btcpayserver.org/FAQ/LightningNetwork/

[^1_5]: https://corti.com/level-up-your-bitcoin-payments-running-your-own-btcpay-server-in-azure-and-connecting-it-to-your-umbrel-lightning-node/

[^1_6]: https://docs.btcpayserver.org/Docker/

[^1_7]: https://docs.btcpayserver.org/FAQ/Deployment/

[^1_8]: https://docs.btcpayserver.org/Deployment/ManualDeploymentExtended/

[^1_9]: https://github.com/btcpayserver/BTCPayServer.Lightning

[^1_10]: https://www.reddit.com/r/lightningnetwork/comments/qapiax/integrate_btcpay_server_for_bitcoin_lightning/

[^1_11]: https://docs.btcpayserver.org/Breez/

[^1_12]: https://docs.btcpayserver.org/LightningNetwork_PaymentChannels/

[^1_13]: https://docs.btcpayserver.org/Contribute/DevCode/

[^1_14]: https://hub.docker.com/u/btcpayserver

[^1_15]: https://www.voltage.cloud/blog/how-to-accept-bitcoin-and-lightning-network-payments

[^1_16]: https://docs.btcpayserver.org/Deployment/LightningInABox/

[^1_17]: https://docs.btcpayserver.org/Deployment/voltagecloud/

[^1_18]: https://github.com/btcpayserver/dockerfile-deps

[^1_19]: https://bowtieddevil.com/post/btcpayserver/

[^1_20]: https://github.com/btcpayserver/btcpayserver/discussions/6139


---

# what is btcpay server best practices for running a bitcoin node as part of the service stack?

BTCPay’s best practice is to run a locally‑connected, fully validating Bitcoin Core node (often pruned) on the same host or LAN, with sane resource sizing, secure networking, and disciplined backup/upgrade routines. [^2_1][^2_2]

## Node type and pruning

- Use **Bitcoin Core** as the node backend; it is the reference and officially supported implementation for BTCPay. [^2_1][^2_3]
- For typical BTCPay deployments, a pruned full node is recommended to save disk while retaining full validation; 80 GB storage with pruning enabled is the documented minimum for Bitcoin + Lightning. [^2_2][^2_4]


## Bitcoin Core configuration

- Enable RPC and local access for BTCPay and NBXplorer, e.g. in `bitcoin.conf`: `server=1`, `rpcbind=127.0.0.1`, `rpcallowip=127.0.0.1/32`, `whitelist=127.0.0.1`. [^2_1]
- Keep bitcoind on reliable SSD/NVMe storage and expect initial sync to take 1–5 days depending on bandwidth and CPU; do not use the node for payments until fully synchronized. [^2_5][^2_4]


## Resource sizing and placement

- Run bitcoind on the same machine as BTCPay or on a low‑latency LAN segment to avoid RPC and P2P reliability issues. [^2_6]
- For production e‑commerce, community guidance is to target at least 2–4 vCPUs, 4–8 GB RAM, and ~80–100 GB SSD for a pruned Bitcoin node plus BTCPay stack, scaling up if you add more chains or services. [^2_2][^2_7]


## Security and networking

- Bind RPC only to localhost or a private interface and avoid exposing bitcoind RPC to the public internet; if remote access is needed, use an authenticated tunnel or VPN. [^2_1][^2_8]
- Use a static IP (or stable internal address), firewall unneeded ports, and open only P2P (8333) and any reverse‑proxy ports you actually intend to serve externally. [^2_9][^2_8]


## Operations, upgrades, and backups

- Treat the BTCPay + node box as an appliance: apply OS and Docker updates, then upgrade BTCPay and its services via the provided scripts or compose stack in controlled maintenance windows. [^2_4][^2_2]
- Back up at least the BTCPay `.env`/configuration, database volumes, and the Bitcoin wallet data directory; for pruned nodes, backing up wallet/keys is more important than historical block data. [^2_4][^2_1]
<span style="display:none">[^2_10][^2_11][^2_12][^2_13][^2_14][^2_15][^2_16][^2_17][^2_18][^2_19][^2_20]</span>

<div align="center">⁂</div>

[^2_1]: https://docs.btcpayserver.org/Deployment/ManualDeploymentExtended/

[^2_2]: https://docs.btcpayserver.org/FAQ/Deployment/

[^2_3]: https://docs.btcpayserver.org/Deployment/ManualDeployment/

[^2_4]: https://xtom.com/blog/how-to-setup-btcpay-crypto-payment-processing/

[^2_5]: https://docs.btcpayserver.org/FAQ/Synchronization/

[^2_6]: https://docs.btcpayserver.org/Development/

[^2_7]: https://github.com/btcpayserver/btcpayserver/discussions/6139

[^2_8]: https://techlatest.net/support/btcpay_server_with_bitcoin_fullnode_support/gcp_gettingstartedguide/index.html

[^2_9]: https://docs.btcpayserver.org/Deployment/LightningInABox/

[^2_10]: https://docs.btcpayserver.org/LightningNetwork/

[^2_11]: https://docs.btcpayserver.org/Deployment/

[^2_12]: https://www.reddit.com/r/BitcoinBeginners/comments/959on6/best_practices_for_running_full_nodes/

[^2_13]: https://www.lunanode.com/guides/btcpay

[^2_14]: https://docs.btcpayserver.org/FAQ/General/

[^2_15]: https://docs.btcpayserver.org/FAQ/

[^2_16]: https://www.swanbitcoin.com/education/3-easy-ways-to-run-your-own-bitcoin-node/

[^2_17]: https://www.reddit.com/r/lightningnetwork/comments/qapiax/integrate_btcpay_server_for_bitcoin_lightning/

[^2_18]: https://docs.btcpayserver.org/Walkthrough/

[^2_19]: https://docs.btcpayserver.org/Development/LocalDevelopment/

[^2_20]: https://www.youtube.com/watch?v=ubj5wpsmqN8


---

# Backup and recovery steps for BTCPay node wallets and channels

BTCPay backup and recovery has three distinct layers: the BTCPay app/database, the on‑chain Bitcoin wallet(s), and Lightning node seeds/channel backups. Each layer needs its own backup and restore procedure. [^3_1][^3_2]

## 1. BTCPay server stack backup

For the Docker reference deployment, use the built‑in backup script to capture app state, database, and volumes (but not the blockchain). [^3_1][^3_3]

- Run as root on the BTCPay host:
    - `cd $BTCPAY_BASE_DIRECTORY/btcpayserver-docker`
    - `./btcpay-backup.sh` (optionally with `BTCPAY_BACKUP_PASSPHRASE` set for encryption). [^3_1]
- The script will:
    - Dump the database, stop BTCPay, archive Docker volumes (excluding `blocks`/`chainstate`), optionally encrypt, then restart BTCPay. [^3_1]
- Store the resulting `backup.tar.gz` (or `.tar.gz.gpg`) off‑box (object storage, rsync to backup host, etc.) and periodically test restore in a staging environment. [^3_1][^3_4]

To restore: run `./btcpay-restore.sh /path/to/backup.tar.gz[.gpg]` as root; it will stop the stack, restore volumes and DB, then restart BTCPay. [^3_1]

## 2. On‑chain node/BTCPay wallets

BTCPay itself does not need private keys if you’re using an external wallet (xpub‑only), so the primary backup is that external wallet’s seed and metadata. [^3_4][^3_5]

- If using an **external wallet** (hardware or Electrum):
    - Back up the wallet seed phrase, passphrase (if any), and/or hardware wallet device (with secure PIN). [^3_6][^3_7]
    - In BTCPay, your store just holds the xpub; on restore, you can re‑import the wallet or xpub—fund safety depends entirely on the external wallet backup. [^3_4][^3_5]
- If using BTCPay’s **hot wallet / internal wallet**:
    - Back up the recovery seed shown during wallet creation (or within your wallet software if created externally and imported). [^3_6][^3_7]
    - Treat this like any Bitcoin seed: never store unencrypted in digital form; write down and secure physically. [^3_7][^3_8]


## 3. Lightning node backup (LND / CLN)

Lightning is where you can lose funds if backups are wrong or stale; BTCPay’s docs emphasize that **old channel states are toxic**. [^3_1][^3_2]

### LND (with BTCPay)

- Before using Lightning, back up:
    - **LND seed**: in BTCPay go to `Server Settings → Services → LND Seed Backup` and securely record the seed words; this recovers the on‑chain wallet and is required for static channel backups. [^3_9][^3_2]
    - **Static channel backup (SCB)**: export via `lncli exportchanbackup --all` or from UI tools (RTL/Thunderhub/BTCPay integrations), and store this file offline in multiple secure locations. [^3_10][^3_11]
- Disaster recovery pattern BTCPay maintainers recommend:
    - Stand up a fresh LND node (not necessarily via BTCPay).
    - Restore the LND seed and SCB file, let it connect to the network, and let remote peers force‑close channels. [^3_12][^3_9]
    - Once funds return on‑chain, sweep them to a fresh wallet or to the recovered node.


### Core Lightning (CLN)

- Back up CLN’s **hsm_secret** file (on‑chain keys) and follow CLN‑specific guidance for channel state backups; BTCPay docs point out that seed alone is not enough for channel funds. [^3_2][^3_13]
- hsm_secret must be stored with very high confidentiality; treat like a private key seed. [^3_2][^3_13]


## 4. Recommended backup cadence

Because Lightning channel state changes frequently, traditional nightly backups are unsafe for channel data. [^3_1][^3_2]

- BTCPay stack archive (`btcpay-backup.sh`):
    - Daily or weekly, depending on change rate, with offsite replication. [^3_1]
- On‑chain wallet seeds (Bitcoin + LND/CLN):
    - One‑time backup on creation, then validate by test‑restore on a clean environment. [^3_2][^3_7]
- LND SCB / CLN channel backups:
    - Export after channel opens/changes, and consider automating periodic off‑box sync of SCB/channel backup files. [^3_2][^3_10]


## 5. Recovery runbook (high‑level)

In a Ryno/TerraHash context you’ll want a clear runbook per site or cluster: [^3_1][^3_2]

- **BTCPay app loss / host loss**:
    - Recreate host (VM/bare metal), install Docker + BTCPay, copy backup archive to host, run `btcpay-restore.sh`, and re‑point DNS/reverse proxy. [^3_1][^3_3]
- **Bitcoin node disk corruption**:
    - Rebuild node from scratch, resync blockchain (no funds lost; node state is reproducible), reconnect to BTCPay and NBXplorer. [^3_14][^3_15]
- **On‑chain wallet loss**:
    - Restore from wallet seed (hardware or Electrum/BTCPay wallet), rescan if necessary, and then re‑plug xpub or wallet to BTCPay if needed. [^3_6][^3_4]
- **Lightning node loss**:
    - For LND: restore seed + SCB on a clean LND node, let channels close, then sweep recovered funds to a fresh wallet/node; only after funds are safe should BTCPay Lightning be re‑attached. [^3_9][^3_12]

If you want, the next step can be a site‑specific backup layout (e.g., where to mount volumes and how to sync SCB/`hsm_secret` into your existing backup system across your mining/edge DC clusters).
<span style="display:none">[^3_16][^3_17][^3_18][^3_19][^3_20][^3_21][^3_22][^3_23][^3_24][^3_25][^3_26][^3_27][^3_28][^3_29][^3_30][^3_31][^3_32][^3_33][^3_34][^3_35][^3_36][^3_37][^3_38][^3_39][^3_40][^3_41]</span>

<div align="center">⁂</div>

[^3_1]: https://docs.btcpayserver.org/Docker/backup-restore/

[^3_2]: https://docs.btcpayserver.org/LightningNetwork/

[^3_3]: https://docs.btcpayserver.org/Docker/

[^3_4]: https://docs.btcpayserver.org/FAQ/General/

[^3_5]: https://docs.btcpayserver.org/FAQ/Wallet/

[^3_6]: https://docs.btcpayserver.org/Wallet/

[^3_7]: https://docs.btcpayserver.org/ElectrumWallet/

[^3_8]: https://freedomnode.com/guides/how-to-backup-and-restore-a-bitcoin-wallet/

[^3_9]: https://docs.btcpayserver.org/FAQ/LightningNetwork/

[^3_10]: https://www.reddit.com/r/lightningnetwork/comments/tfsjxs/proper_format_for_the_lnd_backuprestore/

[^3_11]: https://www.reddit.com/r/lightningnetwork/comments/mefojq/backing_up_a_btcpay_server_node/

[^3_12]: https://github.com/btcpayserver/btcpayserver-docker/issues/138

[^3_13]: https://www.youtube.com/watch?v=fvB1SmY-y98

[^3_14]: https://docs.btcpayserver.org/Deployment/ManualDeploymentExtended/

[^3_15]: https://docs.btcpayserver.org/FAQ/Synchronization/

[^3_16]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_bfc457fa-c8bf-4b35-8a07-c7d1afb3da87/27050d78-0c15-406f-9653-c6f427985221/TerraHash-Stack-Product-Catalog-2b5ca07db84980da906dd17a2c0d90f2_all.csv

[^3_17]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_bfc457fa-c8bf-4b35-8a07-c7d1afb3da87/13ad9cd4-dcec-4066-9eff-e9b50fc7e683/add-https-github-com-milvus-io-qxnfSU0KT66bGpxapL3Prg.md

[^3_18]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_bfc457fa-c8bf-4b35-8a07-c7d1afb3da87/25a12905-930a-4b85-b77b-57009dfc7d99/Evaluate-emerging-trends-in-global-bitcoin-mining.md

[^3_19]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_bfc457fa-c8bf-4b35-8a07-c7d1afb3da87/3be0111d-c8bd-4a6f-9e6c-acbb8ea89293/terrahash-stack-litepaper-technical-v1-0.pdf

[^3_20]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_bfc457fa-c8bf-4b35-8a07-c7d1afb3da87/ebcab18c-b2e8-4822-997b-3dcd4a694bba/terrahash-stack-whitepaper-technical-v1-0.pdf

[^3_21]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_bfc457fa-c8bf-4b35-8a07-c7d1afb3da87/7e581c25-b453-44ae-8920-cf0308fce694/the-terrahash-stack-miner-chas-8ax.XtZERpaAbCQ_dqbkTA.md

[^3_22]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_bfc457fa-c8bf-4b35-8a07-c7d1afb3da87/98555c0f-537e-49e1-9d1d-f9f4aa241ace/i-am-working-on-developing-an-gZI0f7_5SnOWOy7yTjOmAw.md

[^3_23]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_bfc457fa-c8bf-4b35-8a07-c7d1afb3da87/b0631b49-c944-4ab1-9fea-a002da99d010/let-s-work-on-an-official-terr-s0mSohM7Qge.jQtHfVHpxw.md

[^3_24]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_bfc457fa-c8bf-4b35-8a07-c7d1afb3da87/ff442c61-e016-4ade-a65b-52d5f221d6dd/Info-Deck-Ryno-x-TerraHash-Stack-JV-10_25.pdf

[^3_25]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_bfc457fa-c8bf-4b35-8a07-c7d1afb3da87/bf6e3323-dde6-485f-8cd9-404669bb2861/in-relation-to-terrahash-stack-5mPjlqKpTZuHXf9EdU7LyQ.md

[^3_26]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_bfc457fa-c8bf-4b35-8a07-c7d1afb3da87/537c4cfe-3403-4c56-85bb-28709d7c08be/research-the-centrifuge-blockc-5no4_XjUT7G2z2WxtZlHJQ.md

[^3_27]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_bfc457fa-c8bf-4b35-8a07-c7d1afb3da87/6d3a10ca-3cd4-45ed-8b7e-ff5f93cec342/would-panther-seim-https-panth-6nNUNb.rSR2ULFwN1gSpfA.md

[^3_28]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_bfc457fa-c8bf-4b35-8a07-c7d1afb3da87/0bbee127-f807-4a21-9bec-8ffc714d69cd/Chilldyne-CF-CDU300-Spec-Sheet-A.pdf

[^3_29]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_bfc457fa-c8bf-4b35-8a07-c7d1afb3da87/eaf3f97f-37cb-420a-b4a6-bdfdb2e3fb7a/Chilldyne-Cold-Plate-A.pdf

[^3_30]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_bfc457fa-c8bf-4b35-8a07-c7d1afb3da87/ee9c6b6f-f11e-40f4-9223-5dbb42d423c3/remember-this-for-all-future-d-tQ_SgGt7SsaA7wSmcX3YPw.md

[^3_31]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_bfc457fa-c8bf-4b35-8a07-c7d1afb3da87/db1c40df-a94e-496b-a8c8-855ee907693f/build-a-basic-application-arch-bmoPZv7fSCScyNkM2y9jvg.md

[^3_32]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_bfc457fa-c8bf-4b35-8a07-c7d1afb3da87/6d1e9009-5bd4-482a-b352-63a98fd42550/research-the-best-performing-t-BDocEMD6QJ.wWA47MJVdJQ.md

[^3_33]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_bfc457fa-c8bf-4b35-8a07-c7d1afb3da87/8f5f159e-cf4a-48bf-b4a6-4bfd55d97436/research-yield-baring-stableco-j.tO4VM4QiiJh35dfrWmKA.md

[^3_34]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_bfc457fa-c8bf-4b35-8a07-c7d1afb3da87/c5b8e747-659c-4317-a068-71f905a74781/what-firmware-signals-does-the-oxW1ZExgRF25mwOrnumYJg.md

[^3_35]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_bfc457fa-c8bf-4b35-8a07-c7d1afb3da87/08f4f062-a0f8-429f-8789-64dae2fc80f5/draft-a-basic-prd-application-HkVaps3SRMmkTG.Mz_9Mlw.md

[^3_36]: https://community.umbrel.com/t/backup-for-btcpay-server/13701

[^3_37]: https://github.com/btcpayserver/btcpayserver-docker/issues/496

[^3_38]: https://coinsnap.io/blog/btcpay-server-for-woocommerce/

[^3_39]: https://mynodebtc.github.io/btcpay-server/setup.html

[^3_40]: https://community.umbrel.com/t/seed-words-channel-backups-for-cln/10216

[^3_41]: https://docs.btcpayserver.org/FAQ/


---

# How to perform encrypted archive backups for BTCPay volumes

Encrypted archive backups for BTCPay are done with the built‑in backup scripts plus the `BTCPAY_BACKUP_PASSPHRASE` env var, which GPG‑encrypts the tarball of your Docker volumes. [^4_1][^4_2]

## One‑off encrypted backup (Docker install)

Run as `root` on the BTCPay host. [^4_1]

```bash
sudo su -
cd "$BTCPAY_BASE_DIRECTORY/btcpayserver-docker"

# Set passphrase without leaving it in shell history
read -s -p "Enter passphrase: " BTCPAY_BACKUP_PASSPHRASE
export BTCPAY_BACKUP_PASSPHRASE

./btcpay-backup.sh
```

- This creates an encrypted `backup.tar.gz.gpg` in the backup directory, excluding `blocks` and `chainstate` but including BTCPay volumes and DB. [^4_1]
- Store the passphrase **outside** the server (e.g., Bitwarden + offline paper copy). [^4_1][^4_3]


## Restoring an encrypted archive

On the new or rebuilt host, again as `root`. [^4_1][^4_4]

```bash
sudo su -
cd "$BTCPAY_BASE_DIRECTORY/btcpayserver-docker"

read -s -p "Enter passphrase: " BTCPAY_BACKUP_PASSPHRASE
export BTCPAY_BACKUP_PASSPHRASE

./btcpay-restore.sh /path/to/backup.tar.gz.gpg
```

- The script decrypts, stops BTCPay, restores Docker volumes, imports the DB, and restarts BTCPay. [^4_1]
- If the passphrase is wrong or missing, you’ll see a decryption failure and restore will abort. [^4_1][^4_4]


## Using `backup.sh` + remote storage

Newer docs also expose a higher‑level `backup.sh` wrapper with providers. [^4_2][^4_5]

Examples:

```bash
cd "$BTCPAY_BASE_DIRECTORY/btcpayserver-docker"

# Timestamped local encrypted backup
export BTCPAY_BACKUP_PASSPHRASE="your-long-passphrase"
BACKUP_TIMESTAMP=true ./backup.sh

# Encrypted backup pushed over SCP
export BTCPAY_BACKUP_PASSPHRASE="your-long-passphrase"
BACKUP_PROVIDER=SCP SCP_TARGET="backup-host:/data/btcpay" ./backup.sh
```

- `backup.sh` orchestrates `btcpay-backup.sh`, so the same passphrase variable applies for encryption. [^4_2][^4_1]


## Operational best practices (TerraHash / Ryno context)

- Run backups from cron/systemd timer during off‑peak (e.g., every 6–12 hours), pushing to offsite storage. [^4_1][^4_6]
- Exclude Lightning channel data from “volume‑only” restore plans; continue to back up LND SCBs / CLN `hsm_secret` using their native mechanisms and store separately. [^4_7][^4_8]
- Regularly test restore into a staging BTCPay instance so the encrypted archives and passphrase handling are validated end‑to‑end. [^4_1][^4_3]
<span style="display:none">[^4_10][^4_11][^4_12][^4_13][^4_14][^4_15][^4_16][^4_17][^4_18][^4_19][^4_20][^4_21][^4_22][^4_23][^4_24][^4_25][^4_26][^4_27][^4_28][^4_29][^4_30][^4_31][^4_32][^4_33][^4_34][^4_35][^4_36][^4_37][^4_38][^4_39][^4_40][^4_41][^4_42][^4_9]</span>

<div align="center">⁂</div>

[^4_1]: https://docs.btcpayserver.org/Docker/backup-restore/

[^4_2]: https://docs.btcpayserver.org/Docker/

[^4_3]: https://docs.btcpayserver.org/FAQ/General/

[^4_4]: https://github.com/btcpayserver/btcpayserver-docker/blob/master/btcpay-restore.sh

[^4_5]: https://github.com/btcpayserver/btcpayserver-docker/issues/116

[^4_6]: https://xtom.com/blog/how-to-setup-btcpay-crypto-payment-processing/

[^4_7]: https://docs.btcpayserver.org/FAQ/LightningNetwork/

[^4_8]: https://www.reddit.com/r/lightningnetwork/comments/tfsjxs/proper_format_for_the_lnd_backuprestore/

[^4_9]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_bfc457fa-c8bf-4b35-8a07-c7d1afb3da87/27050d78-0c15-406f-9653-c6f427985221/TerraHash-Stack-Product-Catalog-2b5ca07db84980da906dd17a2c0d90f2_all.csv

[^4_10]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_bfc457fa-c8bf-4b35-8a07-c7d1afb3da87/13ad9cd4-dcec-4066-9eff-e9b50fc7e683/add-https-github-com-milvus-io-qxnfSU0KT66bGpxapL3Prg.md

[^4_11]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_bfc457fa-c8bf-4b35-8a07-c7d1afb3da87/25a12905-930a-4b85-b77b-57009dfc7d99/Evaluate-emerging-trends-in-global-bitcoin-mining.md

[^4_12]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_bfc457fa-c8bf-4b35-8a07-c7d1afb3da87/3be0111d-c8bd-4a6f-9e6c-acbb8ea89293/terrahash-stack-litepaper-technical-v1-0.pdf

[^4_13]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_bfc457fa-c8bf-4b35-8a07-c7d1afb3da87/ebcab18c-b2e8-4822-997b-3dcd4a694bba/terrahash-stack-whitepaper-technical-v1-0.pdf

[^4_14]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_bfc457fa-c8bf-4b35-8a07-c7d1afb3da87/7e581c25-b453-44ae-8920-cf0308fce694/the-terrahash-stack-miner-chas-8ax.XtZERpaAbCQ_dqbkTA.md

[^4_15]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_bfc457fa-c8bf-4b35-8a07-c7d1afb3da87/98555c0f-537e-49e1-9d1d-f9f4aa241ace/i-am-working-on-developing-an-gZI0f7_5SnOWOy7yTjOmAw.md

[^4_16]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_bfc457fa-c8bf-4b35-8a07-c7d1afb3da87/b0631b49-c944-4ab1-9fea-a002da99d010/let-s-work-on-an-official-terr-s0mSohM7Qge.jQtHfVHpxw.md

[^4_17]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_bfc457fa-c8bf-4b35-8a07-c7d1afb3da87/ff442c61-e016-4ade-a65b-52d5f221d6dd/Info-Deck-Ryno-x-TerraHash-Stack-JV-10_25.pdf

[^4_18]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_bfc457fa-c8bf-4b35-8a07-c7d1afb3da87/bf6e3323-dde6-485f-8cd9-404669bb2861/in-relation-to-terrahash-stack-5mPjlqKpTZuHXf9EdU7LyQ.md

[^4_19]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_bfc457fa-c8bf-4b35-8a07-c7d1afb3da87/537c4cfe-3403-4c56-85bb-28709d7c08be/research-the-centrifuge-blockc-5no4_XjUT7G2z2WxtZlHJQ.md

[^4_20]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_bfc457fa-c8bf-4b35-8a07-c7d1afb3da87/6d3a10ca-3cd4-45ed-8b7e-ff5f93cec342/would-panther-seim-https-panth-6nNUNb.rSR2ULFwN1gSpfA.md

[^4_21]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_bfc457fa-c8bf-4b35-8a07-c7d1afb3da87/0bbee127-f807-4a21-9bec-8ffc714d69cd/Chilldyne-CF-CDU300-Spec-Sheet-A.pdf

[^4_22]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_bfc457fa-c8bf-4b35-8a07-c7d1afb3da87/eaf3f97f-37cb-420a-b4a6-bdfdb2e3fb7a/Chilldyne-Cold-Plate-A.pdf

[^4_23]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_bfc457fa-c8bf-4b35-8a07-c7d1afb3da87/ee9c6b6f-f11e-40f4-9223-5dbb42d423c3/remember-this-for-all-future-d-tQ_SgGt7SsaA7wSmcX3YPw.md

[^4_24]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_bfc457fa-c8bf-4b35-8a07-c7d1afb3da87/db1c40df-a94e-496b-a8c8-855ee907693f/build-a-basic-application-arch-bmoPZv7fSCScyNkM2y9jvg.md

[^4_25]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_bfc457fa-c8bf-4b35-8a07-c7d1afb3da87/6d1e9009-5bd4-482a-b352-63a98fd42550/research-the-best-performing-t-BDocEMD6QJ.wWA47MJVdJQ.md

[^4_26]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_bfc457fa-c8bf-4b35-8a07-c7d1afb3da87/8f5f159e-cf4a-48bf-b4a6-4bfd55d97436/research-yield-baring-stableco-j.tO4VM4QiiJh35dfrWmKA.md

[^4_27]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_bfc457fa-c8bf-4b35-8a07-c7d1afb3da87/c5b8e747-659c-4317-a068-71f905a74781/what-firmware-signals-does-the-oxW1ZExgRF25mwOrnumYJg.md

[^4_28]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_bfc457fa-c8bf-4b35-8a07-c7d1afb3da87/08f4f062-a0f8-429f-8789-64dae2fc80f5/draft-a-basic-prd-application-HkVaps3SRMmkTG.Mz_9Mlw.md

[^4_29]: https://t.me/s/braiins

[^4_30]: https://github.com/btcpayserver/btcpayserver-docker/issues/496

[^4_31]: https://community.umbrel.com/t/backup-for-btcpay-server/13701

[^4_32]: https://support.bitcoin.com/en/articles/5344011-how-to-recover-import-cryptocurrency-wallets

[^4_33]: https://learn.microsoft.com/en-us/azure/backup/backup-encryption

[^4_34]: https://learn.microsoft.com/en-us/answers/questions/741847/add-gpg-encrypt-decrypt-to-datasets-in-data-factor

[^4_35]: https://www.youtube.com/watch?v=VNxE8oY1mA8

[^4_36]: https://learn.microsoft.com/en-us/azure/storage/blobs/client-side-encryption

[^4_37]: https://materialbitcoin.com/in/blog/how-to-backup-and-restore-crypto-wallet/

[^4_38]: https://www.atlantic.net/dedicated-server-hosting/how-to-set-up-btcpay-server-on-ubuntu-22-04-with-docker/

[^4_39]: https://stackoverflow.com/questions/74522095/pgp-encrypt-decrypt-in-azure-blob-storage

[^4_40]: https://bitcointalk.org/index.php?topic=2572701.0

[^4_41]: https://github.com/btcpayserver/btcpayserver-docker/issues/249

[^4_42]: https://docs.btcpayserver.org/FAQ/ServerSettings/

