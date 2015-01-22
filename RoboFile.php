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
			$this->test();

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
		// TODO: At some point my plan is to re-factor
		// all this Sauce Labs stuff into a new Robo Task

		// Our sauce account details
		$sauce_username = 'oopjs';
		$sauce_access_key = 'b86de245-4444-4e34-81f8-14e97a86400b';

		// Make them available to sauce_connect
		putenv("SAUCE_USERNAME=$sauce_username");
		putenv("SAUCE_ACCESS_KEY=$sauce_access_key");

		// Run sauce connect, wait for it to be connected
		echo "\n"; $this->yell('Connecting to Sauce Labs'); echo "\n";
		$sauce_connected = false;
		$process = proc_open('./vendor/bin/sauce_connect', [0 => ['pipe', 'r'], 1 => ['pipe', 'w']], $pipes);
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
			fwrite($pipes[0], "q\n");
			fclose($pipes[0]);
			proc_close($process);
			throw new Exception('Failed to connect!');
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
				['Windows XP', 'internet explorer', '6.0'],
				['Windows XP', 'internet explorer', '7.0'],
				['Windows XP', 'firefox', ''],
				['Windows XP', 'chrome', ''],

				['Windows 7', 'internet explorer', '8.0'],
				['Windows 7', 'internet explorer', '9.0'],
				['Windows 7', 'firefox', ''],
				['Windows 7', 'chrome', ''],

				['Windows 8', 'internet explorer', '10.0'],
				['Windows 8', 'firefox', ''],
				['Windows 8', 'chrome', ''],

				['Windows 8.1', 'internet explorer', '11.0'],
				['Windows 8.1', 'firefox', ''],
				['Windows 8.1', 'chrome', ''],

				['OS X 10.6', 'safari', '5'],
				['OS X 10.6', 'firefox', ''],
				['OS X 10.6', 'chrome', ''],

				['OS X 10.8', 'safari', '6'],
				['OS X 10.8', 'chrome', ''],

				['OS X 10.9', 'safari', '7'],
				['OS X 10.9', 'firefox', ''],
				['OS X 10.9', 'chrome', ''],

				['OS X 10.10', 'safari', '8'],
				['OS X 10.10', 'firefox', ''],
				['OS X 10.10', 'chrome', ''],

				['Linux', 'firefox', ''],
				['Linux', 'chrome', ''],
			]
		])]);

		$jobs = $response->json()['js tests'];

		$overall_pass_or_fail = true;

		// Grab the build id
		$build_id = time();
		$build_tag = shell_exec("git log -1 --pretty=format:'%h - %s (%ci)' --abbrev-commit");

		// Wait for the jobs to complete
		$completed = [];
		while(count($completed) < count($jobs))
		{
			// Loop through the jobs
			foreach ($jobs as $id)
			{
				if (isset($completed[$id])) continue;

				$response = $client->post
				(
					'js-tests/status',
					['body' => json_encode(['js tests' => [$id]])]
				);

				if ($response->json()['completed'] == 1)
				{
					$completed[$id] = true;

					// Grab the platform and result data
					$platform = implode(' ', $response->json()['js tests'][0]['platform']);
					$result = $response->json()['js tests'][0]['result'];
					$job_id = $response->json()['js tests'][0]['job_id'];

					// Set the build number of the job
					$client->put('jobs/'.$job_id, ['body' => json_encode
					([
						'build' => $build_id,
						'tags' => [$build_tag]
					])]);

					// Did we pass or fail?
					if (isset($result['failed']) && $result['failed'] == 0)
					{
						$status = 'PASSED!';
					}
					else
					{
						$status = 'FAILED!';
						$overall_pass_or_fail = false;
					}

					// Output the result of the job
					$this->say('Platform: '.$platform.' - '.$status);
					echo "\n";
					flush();

					// Ouptut failed tests only
					if (isset($result['tests']))
					{
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
				}
			}
		}

		// Close Sauce Connect
		fwrite($pipes[0], "q\n");
		fclose($pipes[0]);
		proc_close($process);

		if (!$overall_pass_or_fail) throw new Exception('Some tests failed!');
	}
}