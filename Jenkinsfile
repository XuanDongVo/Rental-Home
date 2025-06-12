pipeline {
    agent {
        docker {
      image 'node:20-alpine'
      args '-v $HOME/.npm:/root/.npm'
        }
    }

    environment {
        DOCKER_IMAGE = 'xundon/xuandong-rental-home'
        FE_DIR = 'client'
        BE_DIR = 'server'
        GIT_COMMIT_HASH = ''
    }

    stages {
        stage('Checkout') {
      steps {
        echo 'Checking out source code'
        checkout scm
        script {
          env.GIT_COMMIT_HASH = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
          echo "Commit Hash: ${env.GIT_COMMIT_HASH}"
        }
      }
        }

        stage('Install & Build') {
      steps {
        dir("${FE_DIR}") {
          echo 'Installing frontend dependencies'
          sh 'npm ci --cache .npm --prefer-offline'

          echo 'Building frontend'
          sh 'npm run build'
        }
        dir("${BE_DIR}") {
          echo 'Installing backend dependencies'
          sh 'npm ci --cache .npm --prefer-offline'
        }
      }
        }

        stage('Build Docker Images') {
      steps {
        parallel(
                    'Build Frontend Image': {
                        dir("${FE_DIR}") {
                            sh "docker build -t ${DOCKER_IMAGE}:fe-${env.GIT_COMMIT_HASH} --cache-from ${DOCKER_IMAGE}:fe-latest ."
                        }
                    },
                    'Build Backend Image': {
                        dir("${BE_DIR}") {
                            sh "docker build -t ${DOCKER_IMAGE}:be-${env.GIT_COMMIT_HASH} --cache-from ${DOCKER_IMAGE}:be-latest ."
                        }
                    }
                )
        sh 'docker image ls'
      }
        }

        stage('Push Docker Images') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'docker-hub', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
          sh '''
                        echo $DOCKER_PASSWORD | docker login --username $DOCKER_USERNAME --password-stdin
                        docker push ${DOCKER_IMAGE}:fe-${GIT_COMMIT_HASH}
                        docker push ${DOCKER_IMAGE}:be-${GIT_COMMIT_HASH}
                    '''
        }
      }
        }

        stage('Cleanup') {
      steps {
        echo 'Cleaning up old Docker images'
        sh """
                    docker images ${DOCKER_IMAGE} -q | sort -u | xargs -r docker rmi || true
                    docker image prune -f
                """
      }
        }
    }

    post {
        success {
      echo 'Pipeline completed successfully'
      slackSend(channel: '#ci-cd', message: " Build ${env.BUILD_NUMBER} succeeded! Commit: ${env.GIT_COMMIT_HASH}")
        }
        failure {
      echo 'Pipeline failed'
      slackSend(channel: '#ci-cd', message: " Build ${env.BUILD_NUMBER} failed! Commit: ${env.GIT_COMMIT_HASH}")
        }
    }
}
