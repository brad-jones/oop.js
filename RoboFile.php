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
			$next_version = implode('.', $parts).'.'.$last+1;

			$this->taskExec('git tag '.$this->askDefault('Please set the new version number.', $next_version))->run();

			$this->taskExec('git push --tags')->run();
		}
	}
}