.PHONY: install test-keys build start test clean-test-keys stop

TEST_KEY := $(shell solana-keygen pubkey ./tests/test-key.json)

all: install test-keys build start test clean-test-keys stop

install:
	yarn install

test-keys:
	mkdir -p target/deploy
	cp -r tests/test-keypairs/* target/deploy
	LC_ALL=C find programs src -type f -exec sed -i '' -e "s/9KU8ogB4tKAgfxxz94dWq7V5UDB41kMyDeAtq3xMwnjh/$$(solana-keygen pubkey tests/test-keypairs/cardinal_token_manager-keypair.json)/g" {} +
	LC_ALL=C find programs src -type f -exec sed -i '' -e "s/ASARc3C85tapTVLHLfDMdzxiNCjJDM4C7ZmEZNJ5g9FV/$$(solana-keygen pubkey tests/test-keypairs/cardinal_paid_claim_approver-keypair.json)/g" {} +
	LC_ALL=C find programs src -type f -exec sed -i '' -e "s/5Jd9DPJ7Q99dNBRso8Xm1ZE215GRjbtkdPEz8U5QWZfU/$$(solana-keygen pubkey tests/test-keypairs/cardinal_time_invalidator-keypair.json)/g" {} +
	LC_ALL=C find programs src -type f -exec sed -i '' -e "s/7Qt3zVnqXuxqtzZy8iMyhnFfHdcv2UdqweoHvHKtiah1/$$(solana-keygen pubkey tests/test-keypairs/cardinal_use_invalidator-keypair.json)/g" {} +
	LC_ALL=C find programs src -type f -exec sed -i '' -e "s/tzVYw3v7AHVXWdVTEQS4uwM5woPK3NJwBELAE9Mv4tW/$$(solana-keygen pubkey tests/test-keypairs/cardinal_payment_manager-keypair.json)/g" {} +
	LC_ALL=C find programs src -type f -exec sed -i '' -e "s/638EtvgGQTmc2jc9SdAPtLSCjSXRrkyBfSd54xP2pquZ/$$(solana-keygen pubkey tests/test-keypairs/cardinal_transfer_authority-keypair.json)/g" {} +

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
	LC_ALL=C find programs src -type f -exec sed -i '' -e "s/$$(solana-keygen pubkey tests/test-keypairs/cardinal_token_manager-keypair.json)/9KU8ogB4tKAgfxxz94dWq7V5UDB41kMyDeAtq3xMwnjh/g" {} +
	LC_ALL=C find programs src -type f -exec sed -i '' -e "s/$$(solana-keygen pubkey tests/test-keypairs/cardinal_paid_claim_approver-keypair.json)/ASARc3C85tapTVLHLfDMdzxiNCjJDM4C7ZmEZNJ5g9FV/g" {} +
	LC_ALL=C find programs src -type f -exec sed -i '' -e "s/$$(solana-keygen pubkey tests/test-keypairs/cardinal_time_invalidator-keypair.json)/5Jd9DPJ7Q99dNBRso8Xm1ZE215GRjbtkdPEz8U5QWZfU/g" {} +
	LC_ALL=C find programs src -type f -exec sed -i '' -e "s/$$(solana-keygen pubkey tests/test-keypairs/cardinal_use_invalidator-keypair.json)/7Qt3zVnqXuxqtzZy8iMyhnFfHdcv2UdqweoHvHKtiah1/g" {} +
	LC_ALL=C find programs src -type f -exec sed -i '' -e "s/$$(solana-keygen pubkey tests/test-keypairs/cardinal_payment_manager-keypair.json)/tzVYw3v7AHVXWdVTEQS4uwM5woPK3NJwBELAE9Mv4tW/g" {} +
	LC_ALL=C find programs src -type f -exec sed -i '' -e "s/$$(solana-keygen pubkey tests/test-keypairs/cardinal_transfer_authority-keypair.json)/638EtvgGQTmc2jc9SdAPtLSCjSXRrkyBfSd54xP2pquZ/g" {} +

stop:
	pkill solana-test-validator