ENV_FILE := .env
include .env

.PHONY: check-env plan apply destroy bootstrap

check-env:
	@if [ ! -f $(ENV_FILE) ]; then \
		echo ".env file not found."; \
		exit 1; \
	fi
	@if [ -z "$(AWS_PROFILE)" ]; then \
		echo "AWS_PROFILE not set in .env"; \
		exit 1; \
	fi
	@if [ -z "$(USER_INITIALS)" ]; then \
		echo "USER_INITIALS not set in .env"; \
		exit 1; \
	fi
	@echo "Environment loaded."
	aws sts get-caller-identity --profile $(AWS_PROFILE)

plan: check-env
	npm run build
	aws sts get-caller-identity --profile $(AWS_PROFILE)
	cdk synth --profile $(AWS_PROFILE) -c user_initials=$(USER_INITIALS)

apply: check-env
	aws sts get-caller-identity --profile $(AWS_PROFILE)
	cdk deploy --all --profile $(AWS_PROFILE) -c user_initials=$(USER_INITIALS)

destroy: check-env
	cdk destroy --all --profile $(AWS_PROFILE) -c user_initials=$(USER_INITIALS)

bootstrap: check-env
	cdk bootstrap --toolkit-stack-name SMCDK-Toolkit --bootstrap-qualifier SMCDK --profile $(AWS_PROFILE) -c user_initials=$(USER_INITIALS)

diff: check-env
	cdk diff --profile $(AWS_PROFILE) -c user_initials=$(USER_INITIALS)
