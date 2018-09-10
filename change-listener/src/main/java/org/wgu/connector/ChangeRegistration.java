package org.wgu.connector;

import com.leo.sdk.LeoAWS;
import com.leo.sdk.oracle.OracleChangeLoader;
import com.leo.sdk.oracle.OracleChanges;
import com.leo.sdk.oracle.OracleListeners;
import com.typesafe.config.Config;
import com.typesafe.config.ConfigFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import static java.util.concurrent.TimeUnit.SECONDS;

class ChangeRegistration {
    private static final Logger log = LoggerFactory.getLogger(ChangeRegistration.class);
    private static final Config cfg = ConfigFactory.load("oracle_config.properties");

    private final String host;
    private final Integer port;
    private final ExecutorService e;

    private ChangeRegistration(String host, Integer port) {
        this.host = host;
        this.port = port;
        this.e = Executors.newFixedThreadPool(32);
    }

    public static void main(String[] args) {
        String host = cfg.getString("oracle.listener.host");
        int port = cfg.getInt("oracle.listener.port");
        log.info("oracle.user: {}", cfg.getString("oracle.user"));
        String stars = new String(new char[cfg.getString("oracle.pass").length()]).replace("\0", "*");
        log.info("oracle.pass: {}", stars);
        log.info("oracle.listener.host: {}", host);
        log.info("oracle.listener.port: {}", port);
        log.info("oracle.url: {}", cfg.getString("oracle.url"));
        log.info("oracle.tables: {}", cfg.getString("oracle.tables"));
        new ChangeRegistration(host, port).run();
    }

    private void run() {
        OracleChangeLoader loader = OracleChanges.of(LeoAWS.ofChanges());
        loader.register(OracleListeners.of(host, port), e);
        Runtime.getRuntime().addShutdownHook(new Thread(() -> end(loader)));
        log.info("Registration listener initialized");
    }

    private void end(OracleChangeLoader loader) {
        try {
            e.shutdown();
            e.awaitTermination(5, SECONDS);
            e.shutdownNow();

            // Do not automatically deregister at shutdown
            // loader.deregister();
            loader.end();
            log.info("Listener shutdown complete");
        } catch (InterruptedException i) {
            log.warn("Could not finish registration shutdown");
        }
    }
}
