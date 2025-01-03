pipeline {
    agent any
    
    environment {
        APP_PORT = 3000
        IMAGE_NAME = 'quickmeet'
        IMAGE_TAG = "${BUILD_NUMBER}"
        PROD_TAG = 'production'
    }
    //test commit
    stages {
        stage('Debug Info') {
            steps {
                sh 'pwd'
                sh 'ls -la'
                sh 'docker --version'
            }
        }
        
        stage('Create Environment Files') {
            steps {
                script {
                    echo "Creating environment files..."
                    // Create client/.env
                    sh '''
                        set -x
                        cat << EOF > client/.env
VITE_APP_TITLE=QuickMeet
VITE_APP_SLOGAN=One click to book them all
VITE_BACKEND_ENDPOINT=quickmeet.cefalolab.com
VITE_ENVIRONMENT=web
VITE_MOCK_CALENDER=false
EOF
                        ls -la client/.env
                    '''
                    
                    // Create server/.env
                    sh '''
                        set -x
                        cat << EOF > server/.env
APP_PORT=${APP_PORT}
NODE_ENV=${PROD_TAG}
JWT_SECRET=${secrets.JWT_SECRET}
OAUTH_CLIENT_SECRET=${secrets.OAUTH_CLIENT_SECRET}
OAUTH_CLIENT_ID=${secrets.OAUTH_CLIENT_ID}
DOMAIN=quickmeet.cefalolab.com
OAUTH_REDIRECT_URL=quickmeet.cefalolab.com/oauthcallback
EOF
                        ls -la server/.env
                    '''
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    docker.build(
                        "${IMAGE_NAME}:${BUILD_NUMBER}",
                        "--build-arg APP_PORT=${APP_PORT} ."
                    )
                }
            }
        }
        
        stage('Deploy Container') {
            steps {
                script {
                    try {
                        sh '''
                            docker ps -f name=${IMAGE_NAME} -q | xargs --no-run-if-empty docker stop
                            docker ps -a -f name=${IMAGE_NAME} -q | xargs --no-run-if-empty docker rm
                            docker run -d \\
                                --name ${IMAGE_NAME} \\
                                -e APP_PORT=${APP_PORT} \\
                                -p ${APP_PORT}:${APP_PORT} \\
                                ${IMAGE_NAME}:${IMAGE_TAG}
                        '''
                        // Verify container is running
                        sh 'docker ps | grep ${IMAGE_NAME}'
                        
                        // Tag successful build as production
                        sh 'docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${IMAGE_NAME}:${PROD_TAG}'
                    } catch (Exception e) {
                        error "Deployment failed: ${e.message}"
                    }
                }
            }
        }
        
        stage('Cleanup') {
            steps {
                sh 'docker image prune -f'
            }
        }
        
        stage('Verify Deployment') {
            steps {
                sh '''
                    echo "Checking Docker containers..."
                    docker ps
                    echo "Checking Docker images..."
                    docker images
                    echo "Checking application port..."
                    netstat -tulpn | grep ${APP_PORT}
                '''
            }
        }
    }
    
    post {
        always {
            echo "Pipeline completed with status: ${currentBuild.result}"
            sh 'docker ps -a'
        }
    }
    
    options {
        timestamps()
        ansiColor('xterm')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }
}

// test commit