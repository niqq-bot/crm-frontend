```groovy
pipeline {
    agent {
        label 'v'
    }

    options {
        skipDefaultCheckout(true)
        disableConcurrentBuilds()
        timestamps()
    }

    environment {
        REPO_URL = 'https://github.com/niqq-bot/crm-frontend.git'
        BRANCH = 'main'
        IMAGE_NAME = 'crm-frontend'
        CONTAINER_NAME = 'crm-frontend'
        HOST_PORT = '80'
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: "${BRANCH}",
                    url: "${REPO_URL}"

                sh '''
                    echo "Repository checked out successfully"
                    echo "Current commit:"
                    git rev-parse --short HEAD
                '''
            }
        }

        stage('Validate Project') {
            steps {
                sh '''
                    set -eu

                    test -f package.json
                    test -f Dockerfile

                    echo "Checking Docker availability..."
                    docker --version

                    echo "Checking package scripts..."
                    node -e "
                      const p = require('./package.json');
                      if (!p.scripts || !p.scripts.build) {
                        console.error('Missing npm build script');
                        process.exit(1);
                      }
                      console.log('Build script:', p.scripts.build);
                    "
                '''
            }
        }

        stage('Build Frontend Image') {
            steps {
                sh '''
                    set -eu

                    docker build \
                      --pull \
                      -t ${IMAGE_NAME}:${BUILD_NUMBER} \
                      -t ${IMAGE_NAME}:latest \
                      .
                '''
            }
        }

        stage('Deploy to EC2') {
            steps {
                sh '''
                    set -eu

                    # Remove the previous frontend container, if present.
                    docker rm -f ${CONTAINER_NAME} 2>/dev/null || true

                    # Start the new production container.
                    docker run -d \
                      --name ${CONTAINER_NAME} \
                      --restart unless-stopped \
                      -p ${HOST_PORT}:80 \
                      ${IMAGE_NAME}:${BUILD_NUMBER}

                    # Verify that the container remains running.
                    sleep 3

                    if [ "$(docker inspect -f '{{.State.Running}}' ${CONTAINER_NAME})" != "true" ]; then
                        docker logs ${CONTAINER_NAME}
                        exit 1
                    fi

                    echo "Frontend container is running."
                    docker ps --filter "name=${CONTAINER_NAME}"
                '''
            }
        }

        stage('Smoke Test') {
            steps {
                sh '''
                    set -eu

                    for i in $(seq 1 10); do
                        if curl -fsS http://127.0.0.1:${HOST_PORT}/ -o /dev/null; then
                            echo "Frontend HTTP smoke test passed."
                            exit 0
                        fi

                        sleep 2
                    done

                    echo "Frontend HTTP smoke test failed."
                    docker logs ${CONTAINER_NAME}
                    exit 1
                '''
            }
        }
    }

    post {
        success {
            echo 'Frontend deployed successfully!'
            echo 'Open your EC2 public IP using HTTP.'
        }

        failure {
            echo 'Frontend deployment failed. Check the stage logs.'
        }
    }
}
```
