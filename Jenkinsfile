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
                git branch: "${BRANCH}", url: "${REPO_URL}"
            }
        }

        stage('Build and Deploy') {
            steps {
                sh 'docker build --pull -t crm-frontend:latest .'
                sh 'docker rm -f crm-frontend || true'
                sh 'docker run -d --name crm-frontend --restart unless-stopped -p 80:80 crm-frontend:latest'
            }
        }

        stage('Verify Deployment') {
            steps {
                sh 'sleep 3'
                sh 'docker ps --filter name=crm-frontend'
                sh 'curl -f http://127.0.0.1:80/'
            }
        }
    }

    post {
        success {
            echo 'Frontend deployed successfully!'
        }

        failure {
            echo 'Deployment failed. Check the console output.'
        }
    }
}

