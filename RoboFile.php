<?php

// Make sure our local composer autoloader is installed,
// even if this is run from a globally installed copy of robo.
require_once(__DIR__.'/vendor/autoload.php');

// PHP throws warnings if we don't explicitly set the timezone
date_default_timezone_set('UTC');

/**
 * This is project's console commands configuration for Robo task runner.
 *
 * @see http://robo.li/
 */
class RoboFile extends Brads\Robo\Tasks
{
	// Import the gears asset trait
	use Gears\Asset;

	/**
	 * Pushes a new release to github, minifying automagically.
	 */
	public function release()
	{
		$this->yell('Publishing new release.');

		$this->taskCleanDir('./dist')->run();

		$this->taskBuildAsset('./dist/oop.min.js')->source('./src/oop.js')->run();

		$this->taskGitStack()->add('-A')->commit($this->ask('git commit message'))->pull()->push()->run();

		if ($this->askYesNo('Do you want to publish a new version?'))
		{
			$current_version = exec('git tag');
			$parts = explode('.', $current_version);
			$last = array_pop($parts);
			$next_version = implode('.', $parts).'.'.($last+1);

			$this->taskExec('git tag '.$this->askDefault('Please set the new version number.', $next_version))->run();

			$this->taskExec('git push --tags')->run();
		}
	}

	/**
	 * This runs our unit tests.
	 */
	public function test()
	{
		// TODO: At some point my plan is to refactor
		// all this Sauce Labs stuff into a new Robo Task

		// Our sauce account details
		$sauce_username = 'brad-jones';
		$sauce_access_key = '85d1380a-f45d-483e-bfe0-4c99a6f4065d';

		// Make them aviable to sauce_connect
		putenv("SAUCE_USERNAME=$sauce_username");
		putenv("SAUCE_ACCESS_KEY=$sauce_access_key");

		// Run sauce connect, wait for it to be connected
		echo "\n"; $this->yell('Connecting to Sauce Labs'); echo "\n";
		$sauce_connected = false;
		$process = proc_open('./vendor/bin/sauce_connect', [1 => ['pipe', 'w']], $pipes);
		if (is_resource($process))
		{
			while (!feof($pipes[1]) && !$sauce_connected)
			{
				$cmd_output = fread($pipes[1], 4096);
				echo $cmd_output;
				flush();

				if (strrpos($cmd_output, 'Sauce Connect is running!') !== false)
				{
					$sauce_connected = true;
				}
			}
		}

		echo "\n\n";

		// Bail out if it didn't connect
		if (!$sauce_connected)
		{
			$this->say('Failed to connect!');
			$s = proc_get_status($process);
			posix_kill($s['pid'], SIGKILL);
			proc_close($process);
			exit;
		}

		// Fire up a new php web server
		$this->taskServer(8000)->dir('./')->background(true)->run(); echo "\n";

		// Now lets send the unit tests to sauce labs via the REST API
		$this->yell('Running Unit Tests @ Sauce Labs'); echo "\n";

		$client = new GuzzleHttp\Client
		([
			'base_url' => 'https://saucelabs.com/rest/v1/'.$sauce_username.'/',
			'defaults' =>
			[
				'auth' => [$sauce_username, $sauce_access_key],
				'headers' => ['Content-Type' => 'application/json']
			]
		]);

		$response = $client->post('js-tests', ['body' => json_encode
		([
			'name' => 'OopTest',
			'framework' => 'qunit',
			'url' => 'http://localhost:8000/tests/index.html',
			'platforms' =>
			[
				['Windows 7', 'firefox', '27'],
				['Windows XP', 'internet explorer', '6.0']
			]
		])]);

		// Loop through the jobs ids
		foreach ($response->json()['js tests'] as $job_id)
		{
			// Wait for the job to complete
			$completed = false;
			while(!$completed)
			{
				$response = $client->post
				(
					'js-tests/status',
					['body' => json_encode(['js tests' => [$job_id]])]
				);

				if ($response->json()['completed'] == 1)
				{
					$completed = true;
				}
				else
				{
					sleep(1);
				}
			}

			// Grab the platform and result data
			$platform = implode(' ', $response->json()['js tests'][0]['platform']);
			$result = $response->json()['js tests'][0]['result'];

			// Did we pass or fail?
			if ($result['failed'] == 0) $status = 'PASSED!';
			else $status = 'FAILED!';

			// Output the result of the job
			$this->say('Platform: '.$platform.' - '.$status);
			echo "\n";
			flush();

			// Ouptut failed tests only
			foreach ($result['tests'] as $test)
			{
				if ($test['result'] != 1)
				{
					print_r($test);
					echo "\n\n";
					flush();
				}
			}
		}

		// Close Sauce Connect
		$s = proc_get_status($process);
		posix_kill($s['pid'], SIGKILL);
		proc_close($process);
	}
}