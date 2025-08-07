# CDK Lambda Queue Prototype

This project is a prototype AWS CDK stack that deploys an SQS queue with a Lambda consumer, using TypeScript. It supports environment-specific configuration using a `.env` file and provides Makefile commands for consistent workflows.

---

## 🛠 Local Setup

### 1. Install Prerequisites

Make sure you have the following installed globally:

- **AWS CLI**  
  [Install AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)

  ```bash
  aws --version
  ```

- **Node.js (>=16.x)**  
  [Install Node.js](https://nodejs.org/en/)

- **AWS CDK CLI**  
  [Install CDK](https://docs.aws.amazon.com/cdk/v2/guide/cli.html)

  ```bash
  npm install -g aws-cdk
  cdk --version
  ```

- **Make CLI** (Windows)

  - Install via [GnuWin32](http://gnuwin32.sourceforge.net/packages/make.htm) or use **Git Bash**, **WSL**, or [Chocolatey](https://community.chocolatey.org/packages/make):

    ```powershell
    choco install make
    ```

---

### 2. Clone and Install

```bash
git clone <this-repo-url>
cd cdk-lambda-queue-main
npm install
```

---

### 3. Configure AWS SSO (if applicable)

If you're using AWS SSO, configure it via:

[AWS SSO Configuration Instructions](https://docs.aws.amazon.com/cli/latest/userguide/sso-configure-profile-token.html)

---

### 4. Configure Environment

This project uses a `.env` file to manage user-specific configuration. Use the `.env.template` as a starting point:

```bash
cp .env.template .env
```

Edit the `.env` file and set the following:

```env
AWS_PROFILE=tmsandbox   # Your AWS named profile
USER_INITIALS=XY        # Your initials or unique identifier
```

---

## 📦 Project Structure

```
.
├── bin/                            # Entry point for CDK
├── lib/                            # CDK stack definitions
├── services/message-consumer/     # Lambda consumer code
├── infrastructure/stacks/         # Additional infrastructure components
├── .env.template                  # Environment config template
├── Makefile                       # Common scripts
├── package.json                   # NPM dependencies
```

---

## 🧪 Commands (via Makefile)

The following `make` commands are available for consistent workflows:

| Command          | Description                                                     |
| ---------------- | --------------------------------------------------------------- |
| `make check-env` | Validates that `.env` is present and required variables are set |
| `make plan`      | Runs `npm run build` and prints AWS caller identity             |
| `make apply`     | Builds and deploys the CDK stack                                |
| `make destroy`   | Destroys the CDK stack                                          |
| `make bootstrap` | Bootstraps the CDK environment                                  |

Run them like:

```bash
make apply
```

---

## 📂 Deployment Behavior

Each user can deploy their own isolated version of the stack, thanks to the use of the `USER_INITIALS` variable for logical naming separation.

---
