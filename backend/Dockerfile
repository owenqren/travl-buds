FROM maven:3.9-eclipse-temurin-25 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
# Build the .jar file and skip tests to speed up deployment
RUN mvn clean package -DskipTests
# Isolate the correct executable jar
RUN find target/ -name "*.jar" -not -name "*plain.jar" -exec cp {} app.jar \;

FROM eclipse-temurin:25-jre
WORKDIR /app
# Bring over the built file from the previous stage
COPY --from=build /app/app.jar .
EXPOSE 8080
# Start the server (JAVA_TOOL_OPTIONS from your dashboard will apply automatically)
ENTRYPOINT ["java", "-jar", "app.jar"]