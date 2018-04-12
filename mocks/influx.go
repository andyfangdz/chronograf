package mocks

import (
	"context"

	"github.com/influxdata/chronograf"
)

// var _ influx.Client = &InfluxClient{}

// InfluxClient is a mockable influxdb client by overriding the functions.
type InfluxClient struct {
	// URL                *url.URL
	// Authorizer         influx.Authorizer
	// InsecureSkipVerify bool
	// Logger             chronograf.Logger
	// Connect caches the URL and optional Bearer Authorization for the data source
	ConnectF func(context.Context, *chronograf.Source) error
	// Type hits the influxdb ping endpoint and returns the type of influx running
	TypeF func(context.Context) (string, error)
}

// Connect caches the URL and optional Bearer Authorization for the data source
func (c *InfluxClient) Connect(ctx context.Context, src *chronograf.Source) error {
	return c.ConnectF(ctx, src)
}

// Type hits the influxdb ping endpoint and returns the type of influx running
func (c *InfluxClient) Type(ctx context.Context) (string, error) {
	return c.TypeF(ctx)
}
