.PHONY: install test-keys build start test clean-test-keys stop

TEST_KEY := $(shell solana-keygen pubkey ./tests/test-key.json)

all: install test-keys build start test clean-test-keys stop

install:
	yarn install

test-keys:
	mkdir -p target/deploy
	cp -r tests/test-keypairs/* target/deploy
	LC_ALL=C find programs src -type f -exec sed -i '' -e "s/3yMZ4nfMvZhcgAcvmiUZoHVW4eX3opFhHPCf1wX1Be8k/$$(solana-keygen pubkey tests/test-keypairs/cardinal_token_manager-keypair.json)/g" {} +
	LC_ALL=C find programs src -type f -exec sed -i '' -e "s/4MD5VTfXNDN7Z4qzJ5Puet6ZCRgqrfnc8mzosNkviRAW/$$(solana-keygen pubkey tests/test-keypairs/cardinal_paid_claim_approver-keypair.json)/g" {} +
	LC_ALL=C find programs src -type f -exec sed -i '' -e "s/t3JAC837E6YLkJSdz3UZLUZVhLBShZh727c9TRbwUKK/$$(solana-keygen pubkey tests/test-keypairs/cardinal_time_invalidator-keypair.json)/g" {} +
	LC_ALL=C find programs src -type f -exec sed -i '' -e "s/t5DEoCV1arWsMSCurX19CpFASKVyqrvvvDmFvWiGLoE/$$(solana-keygen pubkey tests/test-keypairs/cardinal_use_invalidator-keypair.json)/g" {} +
	LC_ALL=C find programs src -type f -exec sed -i '' -e "s/pmBbdddvcssmfNgNfu8vgULnhTAcnrn841K5QVhh5VV/$$(solana-keygen pubkey tests/test-keypairs/cardinal_payment_manager-keypair.json)/g" {} +
	LC_ALL=C find programs src -type f -exec sed -i '' -e "s/trsMRg3GzFSNgC3tdhbuKUES8YvGtUBbzp5fjxLtVQW/$$(solana-keygen pubkey tests/test-keypairs/cardinal_transfer_authority-keypair.json)/g" {} +

build:
	anchor build
	yarn idl:generate

start:
	solana-test-validator --url https://api.mainnet-beta.solana.com \
		--clone metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s --clone PwDiXFxQsGra4sFFTT8r1QWRMd4vfumiWC1jfWNfdYT --clone crkdpVWjHWdggGgBuSyAqSmZUmAjYLzD435tcLDRLXr \
		--bpf-program ./target/deploy/cardinal_token_manager-keypair.json ./target/deploy/cardinal_token_manager.so \
		--bpf-program ./target/deploy/cardinal_paid_claim_approver-keypair.json ./target/deploy/cardinal_paid_claim_approver.so \
		--bpf-program ./target/deploy/cardinal_time_invalidator-keypair.json ./target/deploy/cardinal_time_invalidator.so \
		--bpf-program ./target/deploy/cardinal_use_invalidator-keypair.json ./target/deploy/cardinal_use_invalidator.so \
		--bpf-program ./target/deploy/cardinal_payment_manager-keypair.json ./target/deploy/cardinal_payment_manager.so \
		--bpf-program ./target/deploy/cardinal_transfer_authority-keypair.json ./target/deploy/cardinal_transfer_authority.so \
		--reset --quiet & echo $$! > validator.PID
	sleep 5
	solana-keygen pubkey ./tests/test-key.json
	solana airdrop 1000 $(TEST_KEY) --url http://localhost:8899

test:
	anchor test --skip-local-validator --skip-build --skip-deploy --provider.cluster localnet

clean-test-keys:
	LC_ALL=C find programs src -type f -exec sed -i '' -e "s/$$(solana-keygen pubkey tests/test-keypairs/cardinal_token_manager-keypair.json)/3yMZ4nfMvZhcgAcvmiUZoHVW4eX3opFhHPCf1wX1Be8k/g" {} +
	LC_ALL=C find programs src -type f -exec sed -i '' -e "s/$$(solana-keygen pubkey tests/test-keypairs/cardinal_paid_claim_approver-keypair.json)/4MD5VTfXNDN7Z4qzJ5Puet6ZCRgqrfnc8mzosNkviRAW/g" {} +
	LC_ALL=C find programs src -type f -exec sed -i '' -e "s/$$(solana-keygen pubkey tests/test-keypairs/cardinal_time_invalidator-keypair.json)/t3JAC837E6YLkJSdz3UZLUZVhLBShZh727c9TRbwUKK/g" {} +
	LC_ALL=C find programs src -type f -exec sed -i '' -e "s/$$(solana-keygen pubkey tests/test-keypairs/cardinal_use_invalidator-keypair.json)/t5DEoCV1arWsMSCurX19CpFASKVyqrvvvDmFvWiGLoE/g" {} +
	LC_ALL=C find programs src -type f -exec sed -i '' -e "s/$$(solana-keygen pubkey tests/test-keypairs/cardinal_payment_manager-keypair.json)/pmBbdddvcssmfNgNfu8vgULnhTAcnrn841K5QVhh5VV/g" {} +
	LC_ALL=C find programs src -type f -exec sed -i '' -e "s/$$(solana-keygen pubkey tests/test-keypairs/cardinal_transfer_authority-keypair.json)/trsMRg3GzFSNgC3tdhbuKUES8YvGtUBbzp5fjxLtVQW/g" {} +

stop:
	pkill solana-test-validator